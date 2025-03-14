-- SQL-Skript zur Aktualisierung der bestehenden Datenbankstruktur
-- Dieses Skript passt bestehende Tabellen an, fügt fehlende Spalten hinzu und korrigiert Datentypen

-- Erweiterung für UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Überprüfung und Aktualisierung der documents-Tabelle
DO $$
BEGIN
    -- Spalte doc_metadata hinzufügen, wenn sie nicht existiert
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'doc_metadata'
    ) THEN
        ALTER TABLE documents ADD COLUMN doc_metadata JSONB;
        RAISE NOTICE 'Spalte doc_metadata zur documents-Tabelle hinzugefügt';
    END IF;
END;
$$;

-- Sicherstellen, dass die tenants-Tabelle alle benötigten Spalten hat
DO $$
BEGIN
    -- Spalte config hinzufügen, wenn sie nicht existiert
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'config'
    ) THEN
        ALTER TABLE tenants ADD COLUMN config JSONB;
        RAISE NOTICE 'Spalte config zur tenants-Tabelle hinzugefügt';
    END IF;
    
    -- Spalte custom_instructions hinzufügen, wenn sie nicht existiert
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'custom_instructions'
    ) THEN
        ALTER TABLE tenants ADD COLUMN custom_instructions TEXT;
        RAISE NOTICE 'Spalte custom_instructions zur tenants-Tabelle hinzugefügt';
    END IF;
    
    -- Spalte use_mistral hinzufügen, wenn sie nicht existiert
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'use_mistral'
    ) THEN
        ALTER TABLE tenants ADD COLUMN use_mistral BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Spalte use_mistral zur tenants-Tabelle hinzugefügt';
    END IF;
    
    -- Spalten für Chat-Bubble-Farben hinzufügen
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'bot_message_bg_color'
    ) THEN
        ALTER TABLE tenants ADD COLUMN bot_message_bg_color VARCHAR(50) DEFAULT '#374151';
        RAISE NOTICE 'Spalte bot_message_bg_color zur tenants-Tabelle hinzugefügt';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'bot_message_text_color'
    ) THEN
        ALTER TABLE tenants ADD COLUMN bot_message_text_color VARCHAR(50) DEFAULT '#ffffff';
        RAISE NOTICE 'Spalte bot_message_text_color zur tenants-Tabelle hinzugefügt';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'user_message_bg_color'
    ) THEN
        ALTER TABLE tenants ADD COLUMN user_message_bg_color VARCHAR(50) DEFAULT '#4f46e5';
        RAISE NOTICE 'Spalte user_message_bg_color zur tenants-Tabelle hinzugefügt';
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'user_message_text_color'
    ) THEN
        ALTER TABLE tenants ADD COLUMN user_message_text_color VARCHAR(50) DEFAULT '#ffffff';
        RAISE NOTICE 'Spalte user_message_text_color zur tenants-Tabelle hinzugefügt';
    END IF;
END;
$$;

-- Tabelle für interaktive Konfigurationen erstellen, falls sie nicht existiert
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interactive_configs') THEN
        CREATE TABLE interactive_configs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            config JSONB NOT NULL DEFAULT '{}'::jsonb,
            CONSTRAINT unique_tenant_id UNIQUE (tenant_id)
        );
        RAISE NOTICE 'Tabelle interactive_configs erstellt';
    END IF;
END;
$$;

-- Tabelle für UI-Komponenten-Konfigurationen erstellen, falls sie nicht existiert
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ui_components_configs') THEN
        CREATE TABLE ui_components_configs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL DEFAULT 'Du bist ein hilfreicher Assistent.',
            rules JSONB NOT NULL DEFAULT '[]'::jsonb,
            default_examples JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_tenant_id_component UNIQUE (tenant_id)
        );
        RAISE NOTICE 'Tabelle ui_components_configs erstellt';
    END IF;
END;
$$;

-- Tabelle für UI-Komponenten-Definitionen erstellen, falls sie nicht existiert
CREATE TABLE IF NOT EXISTS ui_component_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    example_format TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle für Token-Blacklist erstellen, falls sie nicht existiert
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token VARCHAR(1000) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ausgabe zur Bestätigung
SELECT 'Datenbank erfolgreich aktualisiert!' AS message; 