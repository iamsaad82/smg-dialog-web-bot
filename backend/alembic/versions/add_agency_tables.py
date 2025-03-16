"""add agency tables

Revision ID: add_agency_tables
Revises: add_config_column
Create Date: 2024-03-16 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError


# revision identifiers, used by Alembic.
revision = 'add_agency_tables'
down_revision = 'add_config_column'
branch_labels = None
depends_on = None


def upgrade():
    # Erstellen der agencies-Tabelle
    try:
        op.create_table(
            'agencies',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('contact_email', sa.String(), nullable=False),
            sa.Column('logo_url', sa.String(), nullable=True),
            sa.Column('address', sa.String(), nullable=True),
            sa.Column('phone', sa.String(), nullable=True),
            sa.Column('website', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        print("agencies-Tabelle erstellt")
    except ProgrammingError:
        print("agencies-Tabelle existiert bereits, überspringe...")
        pass
    
    # Erstellen der agency_tenant-Tabelle (Verbindungstabelle)
    try:
        op.create_table(
            'agency_tenant',
            sa.Column('agency_id', sa.String(), nullable=False),
            sa.Column('tenant_id', sa.String(), nullable=False),
            sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.PrimaryKeyConstraint('agency_id', 'tenant_id')
        )
        print("agency_tenant-Tabelle erstellt")
    except ProgrammingError:
        print("agency_tenant-Tabelle existiert bereits, überspringe...")
        pass
    
    # Hinzufügen der agency_id-Spalte zur users-Tabelle
    try:
        op.add_column('users', sa.Column('agency_id', sa.String(), sa.ForeignKey('agencies.id'), nullable=True))
        print("agency_id-Spalte zu users hinzugefügt")
    except ProgrammingError:
        print("agency_id-Spalte existiert bereits, überspringe...")
        pass


def downgrade():
    # Entfernen der agency_id-Spalte aus der users-Tabelle
    try:
        op.drop_column('users', 'agency_id')
    except ProgrammingError:
        pass
    
    # Entfernen der agency_tenant-Tabelle
    try:
        op.drop_table('agency_tenant')
    except ProgrammingError:
        pass
    
    # Entfernen der agencies-Tabelle
    try:
        op.drop_table('agencies')
    except ProgrammingError:
        pass 