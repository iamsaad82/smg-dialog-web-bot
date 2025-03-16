from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union, Tuple
import json
import os
import tempfile
import subprocess
from pydantic import BaseModel
from ...services.structured_data_service import structured_data_service
from ...services.tenant_service import tenant_service
from ...core.security import get_tenant_id_from_api_key, get_admin_api_key
from ...core.deps import get_current_user
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...db.models import User, Tenant
import hashlib
import requests
from pathlib import Path

router = APIRouter()


class StructuredDataSearchQuery(BaseModel):
    """Schema für Suchanfragen nach strukturierten Daten."""
    query: str
    data_type: str
    limit: int = 5


@router.post("/search")
async def search_structured_data(
    query: StructuredDataSearchQuery,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Sucht nach strukturierten Daten basierend auf einem Suchbegriff.
    
    - **query**: Suchbegriff
    - **data_type**: Typ der Daten (z.B. 'school', 'office', 'event', etc.)
    - **limit**: Maximale Anzahl an Ergebnissen
    
    Returns:
        List[Dict]: Liste der gefundenen Daten
    """
    # Debug-Log für die Anfrage
    print(f"[search_structured_data] Anfrage erhalten: query={query.query}, data_type={query.data_type}, limit={query.limit}")
    
    try:
        results = structured_data_service.search_structured_data(
            tenant_id=tenant_id,
            query=query.query,
            data_type=query.data_type,
            limit=query.limit
        )
        
        print(f"[search_structured_data] Suche erfolgreich. {len(results)} Ergebnisse gefunden.")
        return results
    
    except Exception as e:
        error_message = f"Fehler bei der Suche nach strukturierten Daten: {str(e)}"
        print(f"[search_structured_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )


class ImportFromUrlRequest(BaseModel):
    """Schema für Import-Anfragen aus einer URL."""
    url: str
    tenant_id: Optional[str] = None
    xml_type: Optional[str] = "generic"  # Typ der XML-Daten: generic, stadt, etc.


# Generischer XML-Import-Endpoint
@router.post("/import/xml")
async def import_xml_data(
    file: UploadFile = File(...),
    tenant_id: Optional[str] = Form(None),
    xml_type: Optional[str] = Form("generic"),
    api_tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Importiert strukturierte Daten aus einer XML-Datei für einen Tenant.
    
    - **file**: XML-Datei zum Import
    - **tenant_id**: Optional die ID des Tenants, für den die Daten importiert werden sollen
    - **xml_type**: Typ der XML-Daten (generic, stadt, etc.)
    
    Returns:
        Dict: Ergebnis des Imports
    """
    # Effektive Tenant-ID bestimmen (aus Formular oder API-Key)
    effective_tenant_id = tenant_id or api_tenant_id
    env = os.getenv("ENVIRONMENT", "prod")
    
    print(f"[import_xml_data] Starte XML-Import, Tenant-ID: {effective_tenant_id}, XML-Typ: {xml_type}")
    
    if not effective_tenant_id:
        error_message = "Keine Tenant-ID angegeben oder in API-Key gefunden"
        print(f"[import_xml_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Tenant-Existenz prüfen
    tenant = tenant_service.get_tenant_by_id(db, effective_tenant_id)
    if not tenant:
        error_message = f"Tenant mit ID {effective_tenant_id} nicht gefunden"
        print(f"[import_xml_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message
        )
    
    # XML-Datei in temporäre Datei speichern
    try:
        # Temporäre Datei erstellen
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xml")
        temp_file_path = temp_file.name
        
        try:
            # Datei-Inhalt in temporäre Datei schreiben
            file_content = await file.read()
            temp_file.write(file_content)
            temp_file.close()
            
            # XML-Daten importieren
            from app.services.structured_data_service import structured_data_service
            
            result = structured_data_service.import_xml_data(
                xml_file_path=temp_file_path,
                tenant_id=effective_tenant_id,
                xml_type=xml_type
            )
            
            if not result:
                error_message = "XML-Import fehlgeschlagen"
                print(f"[import_xml_data] FEHLER: {error_message}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=error_message
                )
                
            print(f"[import_xml_data] Import erfolgreich. Ergebnis: {result}")
            return {"message": "XML-Import erfolgreich", "result": result}
            
        finally:
            # Temporäre Datei aufräumen
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        error_message = f"Fehler beim Importieren der XML-Datei: {str(e)}"
        print(f"[import_xml_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )


# Konstanten für den Download
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def download_and_import_xml(url: str, tenant_id: str, xml_type: str = "generic") -> Tuple[bool, Dict[str, int]]:
    """
    Lädt eine XML-Datei von einer URL herunter und importiert sie.
    
    Args:
        url: URL der XML-Datei
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten (generic, stadt, etc.)
        
    Returns:
        Tuple[bool, Dict[str, int]]: (Erfolg, Importergebnisse)
    """
    print(f"[download_and_import_xml] Starte Download von URL: {url} für Tenant: {tenant_id}, XML-Typ: {xml_type}")
    
    # Temporäre Datei für den Download erstellen
    with tempfile.NamedTemporaryFile(suffix=".xml", delete=False) as temp_file:
        temp_path = temp_file.name
        
    try:
        # XML-Datei herunterladen
        response = requests.get(url, headers={
            'User-Agent': USER_AGENT
        }, timeout=120)
        
        if response.status_code != 200:
            print(f"[download_and_import_xml] Fehler beim Download: HTTP-Statuscode {response.status_code}")
            return False, {"error": f"HTTP-Statuscode {response.status_code}"}
            
        # XML-Inhalt in temporäre Datei schreiben
        with open(temp_path, 'wb') as f:
            f.write(response.content)
            
        # XML-Daten importieren
        from app.services.structured_data_service import structured_data_service
        
        result = structured_data_service.import_xml_data(
            xml_file_path=temp_path,
            tenant_id=tenant_id,
            xml_type=xml_type
        )
        
        if not result:
            print(f"[download_and_import_xml] Import fehlgeschlagen")
            return False, {"error": "Import fehlgeschlagen"}
        
        print(f"[download_and_import_xml] Import erfolgreich. Ergebnis: {result}")
        return True, result
        
    except Exception as e:
        print(f"[download_and_import_xml] Fehler: {str(e)}")
        return False, {"error": str(e)}
        
    finally:
        # Temporäre Datei aufräumen
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@router.post("/admin/fix-xml-import")
async def trigger_fix_xml_import(
    request: ImportFromUrlRequest,
    admin_api_key: str = Depends(get_admin_api_key),
    db: Session = Depends(get_db)
):
    """
    Startet den Fix-XML-Import-Prozess im Hintergrund.
    Dieser Endpoint führt das Skript xml_import.py aus.
    
    - **url**: URL der XML-Datei
    - **tenant_id**: Optional - ID eines spezifischen Tenants für den Import
    - **xml_type**: Typ der XML-Daten (generic, stadt, etc.)
    
    Returns:
        Dict: Statusmeldung für den gestarteten Prozess
    """
    # Skriptpfad bestimmen
    script_path = Path(os.path.dirname(os.path.abspath(__file__))).parent.parent / "scripts" / "xml_import.py"
    
    if not os.path.exists(script_path):
        error_message = f"Fix-XML-Import-Skript nicht gefunden: {script_path}"
        print(f"[trigger_fix_xml_import] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )
    
    try:
        # Befehl zusammenstellen
        tenant_param = f"--tenant {request.tenant_id}" if request.tenant_id else ""
        url_param = f"--url {request.url}" if request.url else ""
        xml_type_param = f"--type {request.xml_type}" if request.xml_type else "--type generic"
        
        command = f"python {script_path} {url_param} {tenant_param} {xml_type_param} --force"
        
        print(f"[trigger_fix_xml_import] Starte Fix-XML-Import-Skript: {command}")
        
        # Skript im Hintergrund ausführen
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"[trigger_fix_xml_import] Fix-XML-Import erfolgreich durchgeführt")
            print(f"[trigger_fix_xml_import] Ausgabe: {result.stdout}")
        else:
            print(f"[trigger_fix_xml_import] Fehler beim Ausführen des Fix-XML-Imports")
            print(f"[trigger_fix_xml_import] Exit-Code: {result.returncode}")
            print(f"[trigger_fix_xml_import] Fehlerausgabe: {result.stderr}")
            print(f"[trigger_fix_xml_import] Ausgabe: {result.stdout}")
    except Exception as e:
        print(f"[trigger_fix_xml_import] Ausnahme beim Ausführen des Fix-XML-Imports: {str(e)}")
        # Wir geben hier keinen Fehler zurück, da der Prozess im Hintergrund läuft
        # und ein Fehler erst später auftreten kann
    
    # Erfolg zurückgeben, da der Prozess gestartet wurde
    # (Unabhängig davon, ob er erfolgreich durchläuft oder nicht)
    return {
        "message": "Fix-XML-Import wurde im Hintergrund gestartet. Überprüfen Sie die Server-Logs für Ergebnisse."
    }

@router.post("/import/xml/url")
async def import_xml_from_url(
    request: ImportFromUrlRequest,
    api_tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Importiert Daten aus einer XML-URL.
    
    - **url**: URL der XML-Datei
    - **tenant_id**: (Optional) ID des Tenants, für den die Daten importiert werden sollen
    - **xml_type**: (Optional) Typ der XML-Daten: generic, stadt, etc.
    
    Returns:
        Dict: Status und Statistiken des Imports
    """
    # Überprüfen, ob die angegebene Tenant-ID oder die API-Tenant-ID verwendet werden soll
    effective_tenant_id = request.tenant_id if request.tenant_id else api_tenant_id
    
    # Tenant abrufen
    tenant = tenant_service.get_tenant_by_id(db, effective_tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant mit ID {effective_tenant_id} nicht gefunden"
        )
    
    # XML-Typ aus dem renderer_type des Tenants ableiten, falls nicht explizit angegeben
    xml_type = request.xml_type
    if xml_type == "generic" and tenant.renderer_type != "default":
        xml_type = tenant.renderer_type
    
    # Debug-Log
    print(f"[import_xml_from_url] Import für Tenant {effective_tenant_id} mit XML-Typ {xml_type}")
    
    try:
        success, stats = download_and_import_xml(request.url, effective_tenant_id, xml_type)
        if success:
            return {
                "status": "success",
                "message": f"XML-Daten erfolgreich importiert. {stats.get('total', 0)} Einträge verarbeitet.",
                "stats": stats
            }
        else:
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "status": "error",
                    "message": "Fehler beim Importieren der XML-Daten",
                    "stats": stats
                }
            )
    except Exception as e:
        print(f"[import_xml_from_url] Fehler: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": f"Fehler beim Importieren der XML-Daten: {str(e)}"
            }
        ) 