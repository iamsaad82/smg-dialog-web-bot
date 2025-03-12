"""add_ui_component_definitions

Revision ID: f3a56e0e4dcb
Revises: 
Create Date: 2025-03-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f3a56e0e4dcb'
down_revision = None  # Diese sollte auf die letzte vorherige Migration verweisen
branch_labels = None
depends_on = None


def upgrade():
    # Prüfen, ob die Tabelle ui_component_definitions bereits existiert
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Tabelle für UI-Komponenten-Definitionen erstellen, wenn sie noch nicht existiert
    if 'ui_component_definitions' not in tables:
        op.create_table(
            'ui_component_definitions',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('example_format', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('name')
        )
        
        # Vorhandene Standard-Definitionen für UI-Komponenten einfügen
        op.execute("""
        INSERT INTO ui_component_definitions (id, name, description, example_format)
        VALUES 
        (
            gen_random_uuid(), 
            'OpeningHoursTable', 
            'Tabelle zur Anzeige von Öffnungszeiten',
            '```json
{
  "text": "Hier sind die Öffnungszeiten:",
  "component": "OpeningHoursTable",
  "data": {
    "Montag": {"open": "08:00", "close": "18:00"},
    "Dienstag": {"open": "08:00", "close": "18:00"},
    "Mittwoch": {"open": "08:00", "close": "18:00"},
    "Donnerstag": {"open": "08:00", "close": "18:00"},
    "Freitag": {"open": "08:00", "close": "16:00"},
    "Samstag": {"closed": true},
    "Sonntag": {"closed": true}
  }
}
```'
        ),
        (
            gen_random_uuid(), 
            'StoreMap', 
            'Karte mit Standorten',
            '```json
{
  "text": "Hier ist eine Übersicht unserer Standorte:",
  "component": "StoreMap",
  "data": {
    "title": "Unsere Standorte",
    "locations": [
      {
        "id": "loc1",
        "name": "Hauptstelle",
        "description": "Zentrale",
        "floor": "EG",
        "category": "Verwaltung"
      }
    ]
  }
}
```'
        ),
        (
            gen_random_uuid(), 
            'ProductShowcase', 
            'Darstellung von Produkten und Angeboten',
            '```json
{
  "text": "Hier sind unsere aktuellen Angebote:",
  "component": "ProductShowcase",
  "data": {
    "title": "Aktuelle Angebote",
    "products": [
      {
        "id": "prod1",
        "name": "Produkt 1",
        "description": "Beschreibung des Produkts",
        "price": "19,99 €",
        "imageUrl": "https://example.com/image.jpg"
      }
    ]
  }
}
```'
        ),
        (
            gen_random_uuid(), 
            'ContactCard', 
            'Kontaktkarten mit Informationen',
            '```json
{
  "text": "Hier sind unsere Kontaktinformationen:",
  "component": "ContactCard",
  "data": {
    "title": "Kontaktdaten",
    "contacts": [
      {
        "id": "contact1",
        "name": "Kundenservice",
        "email": "info@example.com",
        "phone": "+49 123 456789"
      }
    ]
  }
}
```'
        )
        """)
    
    # Existierende Tabelle ui_components_configs anpassen - Renamed aus der alten Struktur
    # Wenn die Tabelle bereits existiert, überspringen wir die Erstellung
    if 'ui_components_configs' not in tables:
        op.create_table(
            'ui_components_configs',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('tenant_id', sa.String(), nullable=False),
            sa.Column('prompt', sa.Text(), nullable=False, server_default='Du bist ein hilfreicher Assistent.'),
            sa.Column('rules', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
            sa.Column('default_examples', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    # Wenn die Tabelle bereits existiert, prüfen wir, ob die Spalte default_examples existiert
    # und fügen sie hinzu, falls sie fehlt
    elif 'default_examples' not in [col['name'] for col in inspector.get_columns('ui_components_configs')]:
        op.add_column('ui_components_configs', sa.Column('default_examples', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade():
    # UI-Komponenten-Definitionen und Anpassungen rückgängig machen
    op.drop_table('ui_component_definitions')
    # Für ui_components_configs nicht die ganze Tabelle löschen, nur die neue Spalte
    op.drop_column('ui_components_configs', 'default_examples') 