#!/bin/bash

# Dieses Skript fügt die is_brandenburg-Spalte zur tenants-Tabelle hinzu, falls sie noch nicht existiert
# Es kann innerhalb des Docker-Containers ausgeführt werden

# PostgreSQL-Verbindungsparameter aus der Umgebung oder Standardwerte verwenden
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-postgres}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASS=${POSTGRES_PASSWORD:-postgres}

echo "Füge is_brandenburg-Spalte zur tenants-Tabelle hinzu, falls nicht vorhanden..."

# SQL-Befehl ausführen, um zu prüfen, ob die Spalte existiert und sie hinzuzufügen, falls nicht
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'is_brandenburg'
    ) THEN
        ALTER TABLE tenants ADD COLUMN is_brandenburg BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX IF NOT EXISTS ix_tenants_is_brandenburg ON tenants (is_brandenburg);
        RAISE NOTICE 'is_brandenburg-Spalte wurde hinzugefügt';
    ELSE
        RAISE NOTICE 'is_brandenburg-Spalte existiert bereits';
    END IF;
END \$\$;
"

echo "Fertig!"

# Mache das Skript ausführbar
chmod +x apply_migration.sh 