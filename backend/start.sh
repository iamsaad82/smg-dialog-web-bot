#!/bin/bash
set -e

# Warten auf PostgreSQL
echo "Warte auf PostgreSQL..."
# Einfache Verbindungsprüfung mit pg_isready (in postgresql-client enthalten)
PG_HOST=${POSTGRES_SERVER:-db}
PG_PORT=${POSTGRES_PORT:-5432}
PG_USER=${POSTGRES_USER:-postgres}
PG_PASSWORD=${POSTGRES_PASSWORD:-postgres}
PG_DB=${POSTGRES_DB:-smg_dialog}

# Explizit DATABASE_URL setzen, um sicherzustellen, dass die korrekte Verbindung verwendet wird
export DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DB}"
echo "Setze DATABASE_URL auf: ${DATABASE_URL}"

until pg_isready -h $PG_HOST -p $PG_PORT -q
do
  echo "Warte auf Postgres-Server $PG_HOST:$PG_PORT..."
  sleep 1
done
echo "PostgreSQL ist bereit"

# Warten auf Weaviate
echo "Warte auf Weaviate..."
while ! curl -s ${WEAVIATE_URL:-http://weaviate:8080}/v1/.well-known/ready > /dev/null; do
  sleep 1
done
echo "Weaviate ist bereit"

# Erstelle die benötigten Tabellen direkt mit psql
echo "Erstelle Datenbank-Struktur manuell..."
PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${PG_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
-- Prüfe, ob die alembic_version Tabelle existiert, wenn nicht, erstelle sie
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    PRIMARY KEY (version_num)
);

-- Prüfe, ob die tenants Tabelle existiert, wenn nicht, erstelle sie
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    api_key VARCHAR NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    description VARCHAR,
    contact_email VARCHAR,
    bot_name VARCHAR DEFAULT 'KI-Assistent'::VARCHAR NOT NULL,
    bot_welcome_message VARCHAR DEFAULT 'Hallo! Wie kann ich Ihnen helfen?'::VARCHAR NOT NULL,
    primary_color VARCHAR DEFAULT '#4f46e5'::VARCHAR NOT NULL,
    secondary_color VARCHAR DEFAULT '#ffffff'::VARCHAR NOT NULL,
    logo_url VARCHAR,
    custom_instructions VARCHAR,
    use_mistral BOOLEAN DEFAULT false NOT NULL,
    bot_message_bg_color VARCHAR DEFAULT '#374151'::VARCHAR NOT NULL,
    bot_message_text_color VARCHAR DEFAULT '#ffffff'::VARCHAR NOT NULL,
    user_message_bg_color VARCHAR DEFAULT '#4f46e5'::VARCHAR NOT NULL,
    user_message_text_color VARCHAR DEFAULT '#ffffff'::VARCHAR NOT NULL,
    renderer_type VARCHAR DEFAULT 'default'::VARCHAR NOT NULL,
    config JSONB,
    PRIMARY KEY (id),
    UNIQUE (api_key)
);

-- Prüfe, ob die documents Tabelle existiert
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR NOT NULL,
    tenant_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content VARCHAR NOT NULL,
    source VARCHAR,
    doc_metadata JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- Erstelle die agencies Tabelle, wenn sie nicht existiert
CREATE TABLE IF NOT EXISTS agencies (
    id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    contact_email VARCHAR NOT NULL,
    logo_url VARCHAR,
    address VARCHAR,
    phone VARCHAR,
    website VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- Erstelle die agency_tenant Tabelle, wenn sie nicht existiert
CREATE TABLE IF NOT EXISTS agency_tenant (
    agency_id VARCHAR NOT NULL,
    tenant_id VARCHAR NOT NULL,
    PRIMARY KEY (agency_id, tenant_id),
    FOREIGN KEY (agency_id) REFERENCES agencies (id),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

-- Prüfe, ob die users Tabelle existiert
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    role VARCHAR DEFAULT 'user'::VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    agency_id VARCHAR,
    last_login TIMESTAMP WITHOUT TIME ZONE,
    password_reset_token VARCHAR,
    password_reset_expires TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id),
    UNIQUE (email),
    FOREIGN KEY (agency_id) REFERENCES agencies (id)
);

-- Prüfe, ob die user_tenant Tabelle existiert
CREATE TABLE IF NOT EXISTS user_tenant (
    user_id VARCHAR NOT NULL,
    tenant_id VARCHAR NOT NULL,
    PRIMARY KEY (user_id, tenant_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

-- Setze die Alembic-Version auf die neueste
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('add_agency_tables');
"

echo "Datenbankstruktur erstellt."

# FastAPI-Server starten
echo "Starte FastAPI-Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} 