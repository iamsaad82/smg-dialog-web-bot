"""add is_brandenburg flag to tenants

Revision ID: add_is_brandenburg
Revises: add_auth_models
Create Date: 2024-06-24 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_is_brandenburg'
down_revision = 'add_auth_models'
branch_labels = None
depends_on = None


def upgrade():
    # Spalte zur Tenant-Tabelle hinzufügen
    op.add_column('tenants', sa.Column('is_brandenburg', sa.Boolean(), nullable=False, server_default='false'))
    
    # Optional: Index für die neue Spalte erstellen, falls häufig danach gefiltert wird
    op.create_index(op.f('ix_tenants_is_brandenburg'), 'tenants', ['is_brandenburg'], unique=False)


def downgrade():
    # Index entfernen
    op.drop_index(op.f('ix_tenants_is_brandenburg'), table_name='tenants')
    
    # Spalte entfernen
    op.drop_column('tenants', 'is_brandenburg') 