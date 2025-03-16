"""remove is_brandenburg flag from tenants

Revision ID: remove_is_brandenburg
Revises: add_is_brandenburg
Create Date: 2024-03-16 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_is_brandenburg'
down_revision = 'add_is_brandenburg'
branch_labels = None
depends_on = None


def upgrade():
    # Entfernen der is_brandenburg-Spalte aus der tenants-Tabelle
    op.drop_column('tenants', 'is_brandenburg')


def downgrade():
    # Wiederherstellung der is_brandenburg-Spalte in der tenants-Tabelle
    op.add_column('tenants', sa.Column('is_brandenburg', sa.BOOLEAN(), server_default=sa.text('false'), nullable=False)) 