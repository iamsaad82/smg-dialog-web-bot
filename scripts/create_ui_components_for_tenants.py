#!/usr/bin/env python3
"""
Skript zum Erstellen von Standard-UI-Komponenten für alle aktiven Tenants.
Dieses Skript findet alle Tenants in der Datenbank und erstellt für jeden,
der noch keine UI-Komponenten-Konfiguration hat, eine neue mit Standardwerten.
"""

import sys
import uuid

from app.db.session import get_db
from app.db.models import UIComponentsConfigDB, Tenant
from sqlalchemy.orm import Session

# Standard-Konfiguration für UI-Komponenten
DEFAULT_PROMPT = """Du bist ein hilfreicher Assistent. Verwende UI-Komponenten, um deine Antworten ansprechender und informativer zu gestalten.

Wenn ein Nutzer nach Öffnungszeiten fragt, verwende die OpeningHoursTable-Komponente.
Wenn ein Nutzer nach Standorten oder Geschäften fragt, verwende die StoreMap-Komponente.
Wenn ein Nutzer nach Produkten oder Angeboten fragt, verwende die ProductShowcase-Komponente.
Wenn ein Nutzer nach Kontaktinformationen fragt, verwende die ContactCard-Komponente.
"""

DEFAULT_RULES = [
    {
        "id": "1",
        "component": "OpeningHoursTable",
        "triggers": ["Öffnungszeiten", "Wann geöffnet", "Wann hat", "geöffnet", "Uhrzeit", "Wann ist auf", "Wann kann ich", "Öffnungszeit", "Wann darf ich", "Besuchszeit"],
        "isEnabled": True
    },
    {
        "id": "2",
        "component": "StoreMap",
        "triggers": ["Wo finde ich", "Welche Geschäfte", "Standort", "Karte", "Laden", "Filiale", "Shop"],
        "isEnabled": True
    },
    {
        "id": "3",
        "component": "ProductShowcase",
        "triggers": ["Angebote", "Produkte", "Was gibt es Neues", "Neuheiten", "Angebot", "Produkt", "Empfehlung"],
        "isEnabled": True
    },
    {
        "id": "4",
        "component": "ContactCard",
        "triggers": ["Kontakt", "Ansprechpartner", "Wen kann ich fragen", "Telefon", "E-Mail", "Email", "Hotline", "Support"],
        "isEnabled": True
    }
]

def create_ui_components_for_tenant(db: Session, tenant: Tenant):
    """Erstellt UI-Komponenten-Konfiguration für einen Tenant"""
    print(f"Verarbeite Tenant: {tenant.name} (ID: {tenant.id})")
    
    # Prüfen, ob bereits eine Konfiguration existiert
    existing_config = db.query(UIComponentsConfigDB).filter(UIComponentsConfigDB.tenant_id == tenant.id).first()
    
    if existing_config:
        print(f"  ➡️ Konfiguration existiert bereits")
        return
    
    # Neue Konfiguration erstellen
    new_config = UIComponentsConfigDB(
        id=str(uuid.uuid4()),
        tenant_id=tenant.id,
        prompt=DEFAULT_PROMPT,
        rules=DEFAULT_RULES
    )
    
    db.add(new_config)
    db.commit()
    print(f"  ✅ Neue UI-Komponenten-Konfiguration erstellt")
    return new_config

def main():
    """Hauptfunktion zum Ausführen des Skripts"""
    print("Starte Erstellung von UI-Komponenten für alle Tenants...")
    
    db = next(get_db())
    
    try:
        # Alle Tenants abrufen
        tenants = db.query(Tenant).all()
        print(f"Gefundene Tenants: {len(tenants)}")
        
        # Für jeden Tenant Konfiguration erstellen
        for tenant in tenants:
            create_ui_components_for_tenant(db, tenant)
        
        print("\nFertig! UI-Komponenten für alle Tenants erstellt oder überprüft.")
    except Exception as e:
        print(f"Fehler bei der Ausführung: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    main() 