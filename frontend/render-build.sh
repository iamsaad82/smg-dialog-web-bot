#!/bin/bash
set -e

echo "=== Render.com Build-Prozess für Next.js Frontend ==="

echo "Node-Version:"
node --version
echo "NPM-Version:"
npm --version

echo "=== Umgebung vorbereiten ==="
# Wir speichern die ursprüngliche NODE_ENV, um sie später wiederherzustellen
ORIGINAL_NODE_ENV=$NODE_ENV
# Umgebung auf development setzen, um alle devDependencies zu installieren
export NODE_ENV=development
export PORT=${PORT:-10000}

echo "=== NPM-Pakete installieren ==="
# Wir verwenden --include=dev, um sicherzustellen, dass devDependencies installiert werden
npm install --include=dev

echo "=== TypeScript und TypeScript-Typdefinitionen als reguläre Abhängigkeiten installieren ==="
# Wir installieren TypeScript und React-Typen als reguläre Abhängigkeiten, nicht als devDependencies
npm install typescript@5.3.2 @types/react@18.2.38 @types/react-dom@18.2.15 eslint@8.54.0 --save

echo "=== Überprüfen, ob TypeScript-Pakete korrekt installiert wurden ==="
npm list typescript @types/react --depth=0

echo "=== Aktuelle Verzeichnisstruktur anzeigen ==="
ls -la

echo "=== Prüfen, ob tsconfig.json existiert ==="
if [ -f tsconfig.json ]; then
  echo "tsconfig.json vorhanden:"
  cat tsconfig.json
else
  echo "WARNUNG: tsconfig.json nicht gefunden!"
  echo "Inhaltsverzeichnis des Projektordners:"
  ls -la
fi

echo "=== Umgebungsvariable für den Build zurücksetzen ==="
export NODE_ENV=$ORIGINAL_NODE_ENV
echo "NODE_ENV für den Build: $NODE_ENV"

echo "=== Next.js Build ausführen ==="
npm run build

echo "=== Build abgeschlossen ==="
ls -la .next/

echo "=== Build erfolgreich ===" 