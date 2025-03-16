#!/usr/bin/env python
"""
Automatisches Migrationsskript, das die aktuelle Alembic-Version prüft und fehlende Migrationen anwendet.
"""
import os
import time
import sys
from sqlalchemy import create_engine, text, inspect

# Verbindungsdaten aus Umgebungsvariablen - Container-Namen verwenden
host = os.environ.get('POSTGRES_SERVER', 'db')
user = os.environ.get('POSTGRES_USER', 'postgres')
password = os.environ.get('POSTGRES_PASSWORD', 'postgres')
db = os.environ.get('POSTGRES_DB', 'smg_dialog')
port = os.environ.get('POSTGRES_PORT', '5432')

print(f"Verwende Datenbankverbindung: postgresql://{user}:***@{host}:{port}/{db}")

# Migrationspfad für den Alembic-Befehl
migrations_path = {
    None: [
        '001',
        '002',
        '003',
        'add_ui_component_definitions',
        'add_auth_models',
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    '001': [
        '002',
        '003',
        'add_ui_component_definitions',
        'add_auth_models',
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    '002': [
        '003',
        'add_ui_component_definitions',
        'add_auth_models',
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    '003': [
        'add_ui_component_definitions',
        'add_auth_models',
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    'add_ui_component_definitions': [
        'add_auth_models',
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    'add_auth_models': [
        'add_is_brandenburg_flag',
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    'add_is_brandenburg_flag': [
        'remove_is_brandenburg_flag',
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    'remove_is_brandenburg_flag': [
        'add_renderer_type_column',
        'add_config_column',
        'add_agency_tables'
    ],
    'add_renderer_type_column': [
        'add_config_column', 
        'add_agency_tables'
    ],
    'add_config_column': [
        'add_agency_tables'
    ],
    'add_agency_tables': []
}

def get_current_version():
    """Holt die aktuelle Alembic-Version aus der Datenbank"""
    # Verbindungs-URL erstellen
    conn_str = f'postgresql://{user}:{password}@{host}:{port}/{db}'
    
    try:
        # Verbindung herstellen
        engine = create_engine(conn_str)
        
        # Prüfen, ob die alembic_version-Tabelle existiert
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'alembic_version' in tables:
            # Aktuelle Version aus der Tabelle auslesen
            with engine.connect() as conn:
                result = conn.execute(text('SELECT version_num FROM alembic_version')).fetchone()
                current_version = result[0] if result else None
                return current_version
        
        return None
    except Exception as e:
        print(f"Fehler beim Abfragen der Datenbankversion: {e}")
        return None

def apply_migrations(current_version):
    """Wendet die fehlenden Migrationen basierend auf der aktuellen Version an"""
    if current_version not in migrations_path:
        print(f"Warnung: Unbekannte Version '{current_version}'. Führe alle Migrationen durch.")
        current_version = None
    
    migrations_to_apply = migrations_path.get(current_version, [])
    
    if not migrations_to_apply:
        print("Keine Migrationen anzuwenden. Datenbank ist aktuell.")
        return True
    
    print(f"Aktuelle Version: {current_version}")
    print(f"Anzuwendende Migrationen: {', '.join(migrations_to_apply)}")
    
    for migration in migrations_to_apply:
        print(f"Wende Migration '{migration}' an...")
        exit_code = os.system(f'alembic upgrade {migration}')
        
        if exit_code != 0:
            print(f"Fehler beim Anwenden der Migration '{migration}'")
            return False
        
        # Kurze Pause, um der Datenbank Zeit zu geben
        time.sleep(1)
    
    print("Alle Migrationen erfolgreich angewendet.")
    return True

if __name__ == "__main__":
    print("Starte automatische Migration...")
    current_version = get_current_version()
    success = apply_migrations(current_version)
    
    if not success:
        print("Migration fehlgeschlagen!")
        sys.exit(1)
    
    print("Migration erfolgreich abgeschlossen.")
    sys.exit(0) 