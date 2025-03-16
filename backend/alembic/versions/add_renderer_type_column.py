"""add renderer_type column

Revision ID: add_renderer_type
Revises: remove_is_brandenburg
Create Date: 2024-03-16 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError


# revision identifiers, used by Alembic.
revision = 'add_renderer_type'
down_revision = 'remove_is_brandenburg'
branch_labels = None
depends_on = None


def upgrade():
    # Hinzufügen der renderer_type-Spalte zur tenants-Tabelle, falls sie nicht existiert
    try:
        op.add_column('tenants', sa.Column('renderer_type', sa.String(), server_default='default', nullable=False))
        print("renderer_type-Spalte hinzugefügt")
    except ProgrammingError:
        print("renderer_type-Spalte existiert bereits, überspringe...")
        pass


def downgrade():
    # Entfernen der renderer_type-Spalte aus der tenants-Tabelle
    try:
        op.drop_column('tenants', 'renderer_type')
    except ProgrammingError:
        print("renderer_type-Spalte existiert nicht, überspringe...")
        pass 