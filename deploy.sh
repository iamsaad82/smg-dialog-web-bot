#!/bin/bash

# Konfiguration
SERVER="dialogengine@46.163.78.76"
REMOTE_DIR="/var/www/vhosts/dialogengine.de/httpdocs"  # Passen Sie den Pfad an Ihre Domain an

# Frontend build
echo "Frontend bauen..."
cd frontend
npm install
npm run build

# Dateien zum Server übertragen
echo "Dateien zum Server übertragen..."
scp -r .next/* $SERVER:$REMOTE_DIR/
scp -r public/* $SERVER:$REMOTE_DIR/public/

# Optional: Backend-Dateien übertragen und Setup auf Server
echo "Backend-Dateien übertragen..."
cd ../backend
scp -r app requirements.txt $SERVER:$REMOTE_DIR/backend/

echo "Deployment abgeschlossen!" 