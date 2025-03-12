#!/bin/sh
set -e

# Tailwind CSS generieren
npx tailwindcss -i ./src/styles/globals.css -o ./src/styles/tailwind.css

# Server im Dev-Modus starten
exec npm run dev 