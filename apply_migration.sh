#!/bin/bash
set -e

# Farben für die Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}= Brandenburg-Flag Migration für SMG-Dialog =${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker ist nicht aktiv. Bitte starten Sie Docker und versuchen Sie es erneut.${NC}"
  exit 1
fi

# Check if the database container is running
if ! docker ps | grep -q "postgres"; then
  echo -e "${YELLOW}Kein laufender PostgreSQL-Container gefunden.${NC}"
  echo -e "${YELLOW}Stellen Sie sicher, dass Ihr Datenbank-Container läuft (docker-compose up -d)${NC}"
  exit 1
fi

# Get the database container name
DB_CONTAINER=$(docker ps | grep postgres | awk '{print $NF}')

echo -e "${GREEN}Datenbank-Container gefunden: ${DB_CONTAINER}${NC}"
echo -e "${YELLOW}Die Datenbankaktualisierung wird vorbereitet...${NC}"

# Execute the SQL script in the container
echo -e "${GREEN}Führe Datenbankaktualisierung durch...${NC}"
docker cp update_database.sql ${DB_CONTAINER}:/tmp/update_database.sql
docker exec -it ${DB_CONTAINER} bash -c "psql -U postgres -d postgres -f /tmp/update_database.sql"

echo -e "${GREEN}Datenbankaktualisierung abgeschlossen!${NC}"
echo -e "${YELLOW}Die 'is_brandenburg' Spalte wurde zur tenants-Tabelle hinzugefügt (sofern sie noch nicht existierte).${NC}"
echo -e "${YELLOW}Sie können jetzt die Checkbox-Funktionalität in den Tenant-Einstellungen testen.${NC}"
echo -e "${BLUE}=============================================${NC}" 