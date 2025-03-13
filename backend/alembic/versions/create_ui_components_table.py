"""create ui_components_configs table

Revision ID: 202403121530
Revises: 003
Create Date: 2024-03-12 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '202403121530'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Neue Tabelle für UI-Komponenten-Konfigurationen erstellen
    op.create_table(
        'ui_components_configs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=False),
        sa.Column('prompt', sa.String(), nullable=False),
        sa.Column('rules', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id')
    )


def downgrade():
    # Tabelle bei Downgrade löschen
    op.drop_table('ui_components_configs') 