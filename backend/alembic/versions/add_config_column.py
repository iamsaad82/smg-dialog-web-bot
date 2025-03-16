"""add config column

Revision ID: add_config_column
Revises: add_renderer_type
Create Date: 2024-03-16 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError


# revision identifiers, used by Alembic.
revision = 'add_config_column'
down_revision = 'add_renderer_type'
branch_labels = None
depends_on = None


def upgrade():
    # Hinzufügen der config-Spalte zur tenants-Tabelle, falls sie nicht existiert
    try:
        op.add_column('tenants', sa.Column('config', sa.JSON(), nullable=True))
        print("config-Spalte hinzugefügt")
    except ProgrammingError:
        print("config-Spalte existiert bereits, überspringe...")
        pass


def downgrade():
    # Entfernen der config-Spalte aus der tenants-Tabelle
    try:
        op.drop_column('tenants', 'config')
    except ProgrammingError:
        print("config-Spalte existiert nicht, überspringe...")
        pass 