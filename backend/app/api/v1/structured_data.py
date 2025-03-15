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
from ...core.security import get_tenant_id_from_api_key
from ...core.deps import get_current_user
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...db.models import User, Tenant
import hashlib
import requests

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
    Durchsucht strukturierte Daten eines bestimmten Typs.
    
    - **query**: Die Suchanfrage
    - **data_type**: Typ der Daten (school, office, event)
    - **limit**: Maximale Anzahl von Ergebnissen
    """
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Validierung des Datentyps
    if query.data_type not in structured_data_service.SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nicht unterstützter Datentyp. Erlaubte Typen: {', '.join(structured_data_service.SUPPORTED_TYPES)}"
        )
    
    results = structured_data_service.search_structured_data(
        tenant_id=tenant_id,
        data_type=query.data_type,
        query=query.query,
        limit=query.limit
    )
    
    return {"results": results}


@router.post("/import/brandenburg")
async def import_brandenburg_data(
    file: UploadFile = File(...),
    tenant_id: Optional[str] = Form(None),
    api_tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Importiert strukturierte Daten aus einer Brandenburg-XML-Datei.
    Authentifizierung erfolgt über API-Key.
    
    - **file**: XML-Datei mit Brandenburg-Daten
    - **tenant_id**: Optional - ID eines spezifischen Tenants für den Import
    """
    # Debug-Log für die Anfrage
    print(f"[import_brandenburg_data] Anfrage erhalten: file={file.filename}, tenant_id={tenant_id}, api_tenant_id={api_tenant_id}")
    
    # Im Entwicklungsmodus erweiterte Logs ausgeben
    env = os.getenv("ENV", "dev")
    print(f"[import_brandenburg_data] Umgebung: {env}")
    
    # Prüfen, ob der Dateiname auf .xml endet
    if not file.filename or not file.filename.endswith('.xml'):
        error_message = f"Nur XML-Dateien werden unterstützt. Erhaltener Dateiname: {file.filename}"
        print(f"[import_brandenburg_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Spezifischer Tenant oder alle Brandenburg-Tenants
    brandenburg_tenants = []
    
    # Wenn tenant_id angegeben wurde, diese verwenden, sonst api_tenant_id
    effective_tenant_id = tenant_id or api_tenant_id
    print(f"[import_brandenburg_data] Effektive Tenant-ID: {effective_tenant_id}")
    
    if effective_tenant_id:
        # Nur den angegebenen Tenant verwenden, wenn er Brandenburg aktiviert hat
        tenant = tenant_service.get_tenant_by_id(db, effective_tenant_id)
        if not tenant:
            error_message = f"Tenant mit ID {effective_tenant_id} nicht gefunden"
            print(f"[import_brandenburg_data] FEHLER: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )
        
        # Im Entwicklungsmodus Brandenburg-Prüfung überspringen
        if env == "dev" or getattr(tenant, 'is_brandenburg', False):
            brandenburg_tenants = [tenant]
        else:
            error_message = f"Tenant {tenant.name} hat die Brandenburg-Integration nicht aktiviert"
            print(f"[import_brandenburg_data] FEHLER: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
    else:
        # Alle Tenants mit Brandenburg-Konfiguration holen
        tenants = tenant_service.get_all_tenants(db)
        brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
    
    if not brandenburg_tenants:
        error_message = "Keine Brandenburg-Tenants gefunden"
        print(f"[import_brandenburg_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message
        )
    
    try:
        # Temporäre Datei erstellen
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            contents = await file.read()
            temp.write(contents)
            temp_filename = temp.name
            
        # XML-Import für jeden Brandenburg-Tenant durchführen
        results = {}
        for tenant in brandenburg_tenants:
            tenant_id = str(tenant.id)
            print(f"[import_brandenburg_data] Importiere Daten für Tenant: {tenant.name} (ID: {tenant_id})")
            result = structured_data_service.import_brandenburg_data(
                xml_file_path=temp_filename,
                tenant_id=tenant_id
            )
            results[tenant.name] = result
            
        # Temp-Datei löschen
        os.unlink(temp_filename)
        
        print(f"[import_brandenburg_data] Import erfolgreich. Ergebnisse: {results}")
        return {"message": "Import erfolgreich", "results": results}
    
    except Exception as e:
        # Sicherstellen, dass temporäre Datei gelöscht wird
        if 'temp_filename' in locals():
            try:
                os.unlink(temp_filename)
            except:
                pass
                
        error_message = f"Fehler beim Importieren der Daten: {str(e)}"
        print(f"[import_brandenburg_data] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )


class ImportFromUrlRequest(BaseModel):
    """Schema für URL-Import-Anfragen."""
    url: str = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
    tenant_id: Optional[str] = None


# Konstanten aus dem Cron-Job-Skript
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def download_and_import_brandenburg_xml(url: str, tenant_id: str) -> Tuple[bool, Dict[str, int]]:
    """
    Lädt eine Brandenburg-XML-Datei von einer URL herunter und importiert sie.
    Entspricht der Funktionalität des Cron-Jobs.
    
    Args:
        url: URL der XML-Datei
        tenant_id: ID des Tenants
        
    Returns:
        Tuple[bool, Dict[str, int]]: (Erfolg, Importergebnisse)
    """
    print(f"[download_and_import_brandenburg_xml] Starte Download und Import von URL: {url} für Tenant: {tenant_id}")
    
    # Temporäre Datei für den Download erstellen
    with tempfile.NamedTemporaryFile(suffix=".xml", delete=False) as temp_file:
        temp_path = temp_file.name
    
    try:
        # XML-Datei herunterladen
        print(f"[download_and_import_brandenburg_xml] Lade XML-Datei von {url} herunter")
        response = requests.get(url, headers={
            'User-Agent': USER_AGENT
        }, timeout=120)
        
        if response.status_code != 200:
            print(f"[download_and_import_brandenburg_xml] Fehler beim Download: HTTP-Statuscode {response.status_code}")
            return False, {"schools": 0, "offices": 0, "events": 0, "dienstleistungen": 0, "ortsrecht": 0, "kitas": 0, "webseiten": 0, "entsorgungen": 0}
            
        # XML-Datei speichern
        with open(temp_path, 'wb') as f:
            f.write(response.content)
            
        file_size = len(response.content)
        print(f"[download_and_import_brandenburg_xml] XML-Datei erfolgreich heruntergeladen: {file_size} Bytes")
        
        # Existierende Daten löschen
        if not structured_data_service.clear_existing_data(tenant_id):
            print(f"[download_and_import_brandenburg_xml] Warnung: Konnte existierende Daten für Tenant {tenant_id} nicht vollständig löschen")
        
        # Neue Daten importieren
        result = structured_data_service.import_brandenburg_data(
            xml_file_path=temp_path,
            tenant_id=tenant_id
        )
        
        # Erfolg melden
        total = sum(result.values())
        print(f"[download_and_import_brandenburg_xml] Import abgeschlossen: {total} Einträge importiert")
        for type_name, count in result.items():
            print(f"[download_and_import_brandenburg_xml]   - {type_name}: {count}")
            
        return True, result
        
    except Exception as e:
        print(f"[download_and_import_brandenburg_xml] Fehler beim Import: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False, {"schools": 0, "offices": 0, "events": 0, "dienstleistungen": 0, "ortsrecht": 0, "kitas": 0, "webseiten": 0, "entsorgungen": 0}
    finally:
        # Temporäre Datei aufräumen
        try:
            os.remove(temp_path)
        except:
            pass

@router.post("/import/brandenburg/url")
async def import_brandenburg_data_from_url(
    request: ImportFromUrlRequest,
    api_tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Importiert strukturierte Daten von einer URL mit Brandenburg-XML.
    Authentifizierung erfolgt über API-Key.
    Verwendet den gleichen Prozess wie der automatische Cron-Job.
    
    - **url**: URL der XML-Datei mit Brandenburg-Daten
    - **tenant_id**: Optional - ID eines spezifischen Tenants für den Import
    """
    # Debug-Log für die Anfrage
    print(f"[import_brandenburg_data_from_url] Anfrage erhalten: url={request.url}, request.tenant_id={request.tenant_id}, api_tenant_id={api_tenant_id}")
    
    # Im Entwicklungsmodus erweiterte Logs ausgeben
    env = os.getenv("ENV", "dev")
    print(f"[import_brandenburg_data_from_url] Umgebung: {env}")
    
    # Spezifischer Tenant oder alle Brandenburg-Tenants
    brandenburg_tenants = []
    
    # Wenn tenant_id in der Anfrage angegeben wurde, diese verwenden, sonst api_tenant_id
    effective_tenant_id = request.tenant_id or api_tenant_id
    print(f"[import_brandenburg_data_from_url] Effektive Tenant-ID: {effective_tenant_id}")
    
    if effective_tenant_id:
        # Nur den angegebenen Tenant verwenden, wenn er Brandenburg aktiviert hat
        tenant = tenant_service.get_tenant_by_id(db, effective_tenant_id)
        if not tenant:
            error_message = f"Tenant mit ID {effective_tenant_id} nicht gefunden"
            print(f"[import_brandenburg_data_from_url] FEHLER: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )
        
        # Im Entwicklungsmodus Brandenburg-Prüfung überspringen
        if env == "dev" or getattr(tenant, 'is_brandenburg', False):
            brandenburg_tenants = [tenant]
        else:
            error_message = f"Tenant {tenant.name} hat die Brandenburg-Integration nicht aktiviert"
            print(f"[import_brandenburg_data_from_url] FEHLER: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
    else:
        # Alle Tenants mit Brandenburg-Konfiguration holen
        tenants = tenant_service.get_all_tenants(db)
        brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
    
    if not brandenburg_tenants:
        error_message = "Keine Brandenburg-Tenants gefunden"
        print(f"[import_brandenburg_data_from_url] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message
        )
    
    try:
        # XML-Import für jeden Brandenburg-Tenant durchführen
        results = {}
        for tenant in brandenburg_tenants:
            tenant_id = str(tenant.id)
            print(f"[import_brandenburg_data_from_url] Importiere Daten für Tenant: {tenant.name} (ID: {tenant_id})")
            
            # Neue Funktion verwenden, die den gleichen Prozess wie der Cron-Job nutzt
            success, result = download_and_import_brandenburg_xml(
                url=request.url,
                tenant_id=tenant_id
            )
            
            if success:
                results[tenant.name] = result
            else:
                results[tenant.name] = {"error": "Import fehlgeschlagen"}
            
        print(f"[import_brandenburg_data_from_url] Import erfolgreich. Ergebnisse: {results}")
        return {"message": "Import erfolgreich", "results": results}
    
    except Exception as e:
        error_message = f"Fehler beim Importieren der Daten von URL: {str(e)}"
        print(f"[import_brandenburg_data_from_url] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )

@router.post("/admin/fix-brandenburg-import")
async def trigger_fix_brandenburg_import(
    background_tasks: BackgroundTasks,
    api_tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Startet den Fix-Brandenburg-Import-Prozess im Hintergrund.
    Dieser Endpoint führt das Skript fix_brandenburg_import.py aus.
    
    Der Import wird asynchron durchgeführt und liefert sofort eine Erfolgsbestätigung.
    Die tatsächlichen Ergebnisse werden in Logs gespeichert.
    """
    # Überprüfen, ob der Benutzer berechtigt ist
    if not api_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentifizierung erforderlich"
        )
    
    # Pfad zum Skript ermitteln
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
                              "fix_brandenburg_import.py")
    
    if not os.path.exists(script_path):
        error_message = f"Fix-Brandenburg-Import-Skript nicht gefunden: {script_path}"
        print(f"[trigger_fix_brandenburg_import] FEHLER: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )
    
    def run_import_script():
        try:
            print(f"[trigger_fix_brandenburg_import] Starte Fix-Brandenburg-Import-Skript: {script_path}")
            # Skript mit Python-Interpreter ausführen
            result = subprocess.run(["python3", script_path], 
                                   capture_output=True, 
                                   text=True,
                                   check=False)
            
            if result.returncode == 0:
                print(f"[trigger_fix_brandenburg_import] Fix-Brandenburg-Import erfolgreich durchgeführt")
                print(f"[trigger_fix_brandenburg_import] Ausgabe: {result.stdout}")
            else:
                print(f"[trigger_fix_brandenburg_import] Fehler beim Ausführen des Fix-Brandenburg-Imports")
                print(f"[trigger_fix_brandenburg_import] Exit-Code: {result.returncode}")
                print(f"[trigger_fix_brandenburg_import] Fehlerausgabe: {result.stderr}")
                print(f"[trigger_fix_brandenburg_import] Ausgabe: {result.stdout}")
        except Exception as e:
            print(f"[trigger_fix_brandenburg_import] Ausnahme beim Ausführen des Fix-Brandenburg-Imports: {str(e)}")
            import traceback
            print(traceback.format_exc())
    
    # Import-Prozess im Hintergrund starten
    background_tasks.add_task(run_import_script)
    
    return {
        "message": "Fix-Brandenburg-Import wurde im Hintergrund gestartet. Überprüfen Sie die Server-Logs für Ergebnisse."
    } 