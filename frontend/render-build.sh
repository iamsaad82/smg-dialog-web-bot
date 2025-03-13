#!/bin/bash
set -e

echo "=== Render.com Build-Prozess für Next.js Frontend ==="

echo "Node-Version:"
node --version
echo "NPM-Version:"
npm --version

echo "=== Umgebung vorbereiten ==="
# Sicherstellen, dass alle erforderlichen Umgebungsvariablen gesetzt sind
export NODE_ENV=production
export PORT=${PORT:-10000}

echo "=== NPM-Pakete installieren ==="
npm install

echo "=== TypeScript und Abhängigkeiten explizit installieren ==="
npm install --save-dev typescript@5.3.2 eslint@8.54.0

echo "=== Next.js Build ausführen ==="
npm run build

echo "=== Build abgeschlossen ==="
ls -la .next/

echo "=== Build erfolgreich ===" 