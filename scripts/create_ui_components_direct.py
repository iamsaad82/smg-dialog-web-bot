from app.db.session import get_db
from sqlalchemy import text
import uuid
import json

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

print("Starte Erstellung von UI-Komponenten für alle Tenants...")

db = next(get_db())

try:
    # Alle Tenant-IDs abrufen
    result = db.execute(text("SELECT id, name FROM tenants"))
    tenants = result.fetchall()
    print(f"Gefundene Tenants: {len(tenants)}")
    
    # Für jeden Tenant Konfiguration erstellen
    for tenant in tenants:
        tenant_id = tenant.id
        tenant_name = tenant.name
        print(f"Verarbeite Tenant: {tenant_name} (ID: {tenant_id})")
        
        # Prüfen, ob bereits eine Konfiguration existiert
        config_result = db.execute(text(f"SELECT id FROM ui_components_configs WHERE tenant_id = '{tenant_id}'"))
        existing_config = config_result.fetchone()
        
        if existing_config:
            print(f"  ➡️ Konfiguration existiert bereits")
            continue
        
        # Neue Konfiguration erstellen
        config_id = str(uuid.uuid4())
        
        # Convert rules to JSON string
        rules_json = json.dumps(DEFAULT_RULES)
        
        db.execute(
            text("INSERT INTO ui_components_configs (id, tenant_id, prompt, rules) VALUES (:id, :tenant_id, :prompt, :rules)"),
            {"id": config_id, "tenant_id": tenant_id, "prompt": DEFAULT_PROMPT, "rules": rules_json}
        )
        db.commit()
        print(f"  ✅ Neue UI-Komponenten-Konfiguration erstellt")
    
    print("\nFertig! UI-Komponenten für alle Tenants erstellt oder überprüft.")
except Exception as e:
    print(f"Fehler bei der Ausführung: {str(e)}")
finally:
    db.close() 