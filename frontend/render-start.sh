#!/bin/bash
set -e

echo "=== Render.com Start-Prozess für Next.js Frontend ==="

echo "Node-Version:"
node --version
echo "NPM-Version:"
npm --version

echo "=== Umgebungsvariablen ==="
echo "PORT: ${PORT}"
echo "NODE_ENV: ${NODE_ENV}"

echo "=== Prüfen, ob .next Directory existiert ==="
if [ ! -d ".next" ]; then
  echo "WARNUNG: .next Directory existiert nicht. Build wird ausgeführt..."
  npm run build
else
  echo ".next Directory gefunden."
  ls -la .next/
fi

echo "=== Next.js Server starten ==="
npm start -- -p ${PORT:-10000} 