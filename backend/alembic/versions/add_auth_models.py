"""add_auth_models

Revision ID: add_auth_models
Revises: add_ui_component_definitions
Create Date: 2023-03-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import enum

# revision identifiers, used by Alembic.
revision = 'add_auth_models'
down_revision = 'add_ui_component_definitions'
branch_labels = None
depends_on = None


def upgrade():
    # Zuerst die agencies-Tabelle erstellen
    op.create_table(
        'agencies',
        sa.Column('id', sa.String(36), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Erstellen der UserRole-Enum
    try:
        op.create_table(
            'users',
            sa.Column('id', sa.String(36), primary_key=True, index=True),
            sa.Column('username', sa.String(50), unique=True, index=True, nullable=False),
            sa.Column('email', sa.String(100), unique=True, index=True, nullable=False),
            sa.Column('first_name', sa.String(50), nullable=False),
            sa.Column('last_name', sa.String(50), nullable=False),
            sa.Column('hashed_password', sa.String(255), nullable=False),
            sa.Column('role', sa.String(20), nullable=False),
            sa.Column('agency_id', sa.String(36), sa.ForeignKey('agencies.id'), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True),
            
            # Authentifizierungsfelder
            sa.Column('last_login', sa.DateTime(), nullable=True),
            sa.Column('password_reset_token', sa.String(255), nullable=True),
            sa.Column('password_reset_expires', sa.DateTime(), nullable=True),
            
            # Zeitstempel
            sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        )
    except:
        pass  # Tabelle existiert möglicherweise bereits
    
    # Erstellen der Token-Blacklist-Tabelle
    try:
        op.create_table(
            'token_blacklist',
            sa.Column('id', sa.String(36), primary_key=True, index=True),
            sa.Column('token', sa.String(255), unique=True, index=True, nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('blacklisted_at', sa.DateTime(), default=sa.func.now()),
        )
    except:
        pass  # Tabelle existiert möglicherweise bereits
    
    # Erstellen der User-Tenant-Verbindungstabelle
    try:
        op.create_table(
            'user_tenant',
            sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), primary_key=True),
            sa.Column('tenant_id', sa.String(36), sa.ForeignKey('tenants.id'), primary_key=True),
        )
    except:
        pass  # Tabelle existiert möglicherweise bereits
    
    # Index für eine schnellere Suche nach Tokens und Benutzern
    try:
        op.create_index(op.f('ix_token_blacklist_token'), 'token_blacklist', ['token'], unique=True)
    except:
        pass  # Index existiert möglicherweise bereits
        
    try:
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    except:
        pass  # Index existiert möglicherweise bereits
        
    try:
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    except:
        pass  # Index existiert möglicherweise bereits


def downgrade():
    # Löschen der Tabellen in umgekehrter Reihenfolge
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_token_blacklist_token'), table_name='token_blacklist')
    
    op.drop_table('user_tenant')
    op.drop_table('token_blacklist')
    op.drop_table('users')
    # Agencies-Tabelle zuletzt löschen
    op.drop_table('agencies') 