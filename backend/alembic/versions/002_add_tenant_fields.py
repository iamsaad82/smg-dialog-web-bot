"""Add tenant fields

Revision ID: 002
Revises: 001
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Neue Spalten zur tenants-Tabelle hinzufügen
    op.add_column('tenants', sa.Column('contact_email', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('bot_name', sa.String(), nullable=False, server_default="KI-Assistent"))
    op.add_column('tenants', sa.Column('bot_welcome_message', sa.String(), nullable=False, server_default="Hallo! Wie kann ich Ihnen helfen?"))
    op.add_column('tenants', sa.Column('primary_color', sa.String(), nullable=False, server_default="#4f46e5"))
    op.add_column('tenants', sa.Column('secondary_color', sa.String(), nullable=False, server_default="#ffffff"))
    op.add_column('tenants', sa.Column('logo_url', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('custom_instructions', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('use_mistral', sa.Boolean(), nullable=False, server_default="false"))
    op.add_column('tenants', sa.Column('bot_message_bg_color', sa.String(), nullable=False, server_default="#374151"))
    op.add_column('tenants', sa.Column('bot_message_text_color', sa.String(), nullable=False, server_default="#ffffff"))
    op.add_column('tenants', sa.Column('user_message_bg_color', sa.String(), nullable=False, server_default="#4f46e5"))
    op.add_column('tenants', sa.Column('user_message_text_color', sa.String(), nullable=False, server_default="#ffffff"))

def downgrade():
    # Spalten wieder entfernen
    op.drop_column('tenants', 'contact_email')
    op.drop_column('tenants', 'bot_name')
    op.drop_column('tenants', 'bot_welcome_message')
    op.drop_column('tenants', 'primary_color')
    op.drop_column('tenants', 'secondary_color')
    op.drop_column('tenants', 'logo_url')
    op.drop_column('tenants', 'custom_instructions')
    op.drop_column('tenants', 'use_mistral')
    op.drop_column('tenants', 'bot_message_bg_color')
    op.drop_column('tenants', 'bot_message_text_color')
    op.drop_column('tenants', 'user_message_bg_color')
    op.drop_column('tenants', 'user_message_text_color') 