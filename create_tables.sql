-- SQL-Skript zur direkten Erstellung aller Datenbanktabellen
-- Ausführen in der Render-PostgreSQL-Datenbank

-- Erweiterung für UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabelle: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    contact_email VARCHAR(255),
    bot_name VARCHAR(255),
    bot_welcome_message TEXT,
    primary_color VARCHAR(255),
    secondary_color VARCHAR(255),
    logo_url VARCHAR(255),
    custom_instructions TEXT,
    use_mistral BOOLEAN DEFAULT FALSE,
    bot_message_bg_color VARCHAR(255),
    bot_message_text_color VARCHAR(255),
    user_message_bg_color VARCHAR(255),
    user_message_text_color VARCHAR(255),
    config JSONB
);

-- Tabelle: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) NOT NULL,  -- ADMIN, AGENCY_ADMIN, EDITOR, USER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    agency_id UUID
);

-- Tabelle: documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Tabelle: token_blacklist
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token VARCHAR(1000) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle: ui_components
CREATE TABLE IF NOT EXISTS ui_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- z.B. BUTTON, TEXT, IMAGE
    content TEXT,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Alembic-Versionstabelle für Migrationsverfolgung
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Neueste Alembic-Version eintragen (muss an die tatsächliche Version angepasst werden)
INSERT INTO alembic_version (version_num) 
VALUES ('add_ui_component_definitions') 
ON CONFLICT (version_num) DO NOTHING; 