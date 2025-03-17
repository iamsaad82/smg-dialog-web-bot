FROM node:18-alpine

WORKDIR /app

# Abhängigkeiten installieren
COPY package.json ./
RUN npm install --legacy-peer-deps

# App-Code kopieren
COPY . .

# shadcn-Komponenten explizit installieren, um sicherzustellen, dass alle benötigten Abhängigkeiten vorhanden sind
RUN npx shadcn@latest add button alert card table tabs badge tooltip checkbox dialog dropdown-menu input label progress scroll-area select sonner textarea
RUN npm install --legacy-peer-deps \
    @radix-ui/react-alert-dialog \
    @radix-ui/react-avatar \
    @radix-ui/react-checkbox \
    @radix-ui/react-collapsible \
    @radix-ui/react-dialog \
    @radix-ui/react-dropdown-menu \
    @radix-ui/react-label \
    @radix-ui/react-progress \
    @radix-ui/react-scroll-area \
    @radix-ui/react-select \
    @radix-ui/react-separator \
    @radix-ui/react-slot \
    @radix-ui/react-switch \
    @radix-ui/react-tabs \
    @radix-ui/react-tooltip \
    @radix-ui/react-accordion \
    sonner \
    zod \
    @hookform/resolvers \
    formidable

# Skript ausführbar machen
RUN chmod +x ./docker-entrypoint.sh

# Development-Modus starten (statt Build)
EXPOSE 3000
CMD ["./docker-entrypoint.sh"] 