# Multi-Tenant KI-Bot with Weaviate & Modern UI

A scalable KI-bot system that allows businesses to operate their own KI-bots for frequently asked questions. Each customer has their own isolated Weaviate index and can upload data to be used as a knowledge base for the bot.

## 🚀 Features

- **Multi-tenant architecture**: Isolated Weaviate indices for each customer
- **Retrieval-Augmented Generation (RAG)**: Combination of Weaviate and LLM (GPT-4 or Mistral)
- **Hybrid search**: Vector search + keyword search for maximum relevance
- **Admin dashboard**: Management of customers, data, and bot settings
- **API for customers**: Access to search and chat functions
- **Ultra modern UI**: Floating input field, animations, modern designs
- **Streaming responses**: Real-time generation and display of answers
- **Embedding on websites**: Classic mode (floating button) and inline mode (widget)
- **Modular API structure**: Well-organized API modules for better maintainability
- **Interactive UI components**: Structured display of information with special components (OpeningHoursTable, ContactCard, etc.)

## 🛠️ Technologies

- **Backend**: FastAPI (Python)
- **Database**: Weaviate (vector database)
- **LLM integration**: OpenAI GPT-4 and Mistral
- **Frontend**: Next.js with TypeScript
- **Styling**: TailwindCSS, Shadcn UI Components
- **Animations**: Framer Motion
- **Deployment**: Docker & Docker Compose

## 🏗️ Project structure

```
/ (Root)
├── backend/                  # FastAPI backend
│   ├── app/                  # Main application
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functions
│   │   ├── db/               # Database models
│   │   ├── services/         # Services (Weaviate, LLM)
│   │   │   ├── interactive/  # Interactive UI components
│   │   │   └── weaviate/     # Weaviate integration
│   │   └── utils/            # Utility functions
│   ├── Dockerfile            # Docker configuration
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js frontend
│   ├── public/               # Static files
│   ├── src/                  # Source code
│   │   ├── api/              # Modular API client
│   │   │   ├── core.ts       # Core API functionality
│   │   │   ├── tenants.ts    # Tenant management
│   │   │   ├── documents.ts  # Document operations
│   │   │   ├── chat.ts       # Chat and completion
│   │   │   ├── interactive.ts # Interactive elements
│   │   │   └── index.ts      # Combined API exports
│   │   ├── components/       # UI components
│   │   │   ├── ui-components/ # Interactive UI components
│   │   │   └── ui-components-editor/ # UI component management
│   │   ├── pages/            # Next.js pages
│   │   ├── styles/           # CSS/Tailwind styles
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   ├── Dockerfile            # Docker configuration
│   └── package.json          # NPM dependencies
└── docker-compose.yml        # Docker Compose configuration
```

## 🚀 Installation and start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (optional: Mistral API key)

### Environment variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key
```

### Starting the application

```bash
# Start all services
docker-compose up -d

# Show logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## 📝 API documentation

After starting, the API documentation is available at the following URL:

```
http://localhost:8000/docs
```

## 🌐 Frontend access

The admin dashboard is available at the following URL:

```
http://localhost:3000
```

## 💻 Frontend Development

### API Client Structure

The frontend uses a modular API client structure for better maintainability:

#### Core API (`api/core.ts`)
- Basic functionality and HTTP client setup
- API key management
- Error handling

#### Tenant API (`api/tenants.ts`)
- Tenant management (create, read, update, delete)
- Admin operations
- Configuration retrieval

#### Document API (`api/documents.ts`)
- Document management
- File uploads (CSV, JSON, Markdown, PDF)
- Reindexing operations

#### Chat API (`api/chat.ts`)
- Chat completions
- Streaming response handling
- Search operations

#### Interactive Elements API (`api/interactive.ts`)
- Managing interactive elements for chat responses
- UI component definitions and configurations

All APIs are combined in `api/index.ts` and exported as a unified API. For backwards compatibility, the old API client is maintained in `utils/api.ts` as a re-export of the new API.

### Usage Example

```typescript
// Modern approach (recommended)
import api from '@/api';

// Legacy approach (still supported)
import { apiClient } from '@/utils/api';

// Setting API key
api.setApiKey('your-api-key');

// Using the API
const response = await api.getCompletion({ 
  messages: [{ role: 'user', content: 'Hello' }]
});
```

## 🔌 Embedding on websites

### Classic mode (floating button)

```html
<script src="http://localhost:3000/embed.js" data-api-key="YOUR_API_KEY" data-mode="classic"></script>
```

### Inline mode (widget)

```html
<script src="http://localhost:3000/embed.js" data-api-key="YOUR_API_KEY" data-mode="inline" data-container-id="chat-container"></script>
<div id="chat-container"></div>
```

## 📊 UI Components System

The system includes a sophisticated UI components feature that allows for structured presentation of information:

### Available UI Components

- **OpeningHoursTable**: Structured display of opening hours
- **ContactCard**: Contact information with actions (call, email, website)
- **StoreMap**: Map with location markers
- **ProductShowcase**: Display of products with images and details

### Management Interface

The UI components can be managed through a dedicated interface in the admin panel:

1. **Configuration**: Define rules for when specific components should be displayed
2. **Live Preview**: Test the behavior of UI components with sample queries
3. **Component Definitions**: Create and manage custom component definitions

For detailed documentation on the UI components system, see [ui-komponenten-system.md](ui-komponenten-system.md).

## 📄 License

This project is licensed under the MIT License.

## 🚀 Deployment für Produktiveinsatz

Für den Einsatz in einer Produktionsumgebung müssen folgende Schritte durchgeführt werden:

### 1. Frontend und Backend konfigurieren

Stellen Sie sicher, dass in der Produktionsumgebung folgende Änderungen vorgenommen wurden:

- **Frontend**: In allen API-Client-Dateien ist der Entwicklungsmodus (`isDevelopment`) deaktiviert
- **Backend**: Alle erforderlichen Umgebungsvariablen sind konfiguriert
- **Authentifizierung**: Stellen Sie sicher, dass die Authentifizierung im `ProtectedLayout` aktiviert ist

### 2. Datenbank-Migrationen durchführen

Vor dem ersten Start müssen alle Datenbank-Migrationen durchgeführt werden:

```bash
cd backend
alembic upgrade head
```

### 3. Super-Admin-Benutzer erstellen

Es gibt zwei Möglichkeiten, einen Super-Admin-Benutzer zu erstellen:

#### Option A: Automatische Erstellung beim ersten Start (empfohlen)

Konfigurieren Sie folgende Umgebungsvariablen in der `.env`-Datei:

```
AUTO_CREATE_SUPERUSER=true
FIRST_SUPERUSER_USERNAME=admin
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=IhrSicheresPasswort
FIRST_SUPERUSER_FIRSTNAME=Admin
FIRST_SUPERUSER_LASTNAME=User
```

Bei dieser Methode wird automatisch ein Admin-Benutzer erstellt, wenn beim Start der Anwendung noch kein Administrator existiert.

#### Option B: Manuelle Erstellung

```bash
cd backend
python -m app.scripts.create_admin_user --username admin --email admin@example.com --password IhrSicheresPasswort --first-name Admin --last-name User
```

Ersetzen Sie `IhrSicheresPasswort` durch ein sicheres Passwort. Mit diesem Benutzer können Sie sich dann als Super-Admin anmelden und weitere Benutzer anlegen.

### 4. Deployment-Optionen

#### A. Lokale Server-Umgebung

Für die Bereitstellung auf einem lokalen Server verwenden Sie:

```bash
docker-compose up -d
```

#### B. Cloud-Deployment mit Render

Für die Bereitstellung in der Render-Cloud:

```bash
render deploy
```

#### C. Manuelles Deployment

Für die manuelle Bereitstellung auf einem Server verwenden Sie das Deployment-Skript:

```bash
bash deploy.sh
```

### 5. Nach dem Deployment

Nach erfolgreichem Deployment:

- Melden Sie sich mit dem erstellten Super-Admin-Benutzer an
- Legen Sie Agenturen und Tenants an
- Konfigurieren Sie die System-Einstellungen
- Erstellen Sie weitere Benutzer nach Bedarf

### 6. Sicherheitshinweise

- Ändern Sie regelmäßig das Passwort des Super-Admin-Benutzers
- Aktivieren Sie die 2-Faktor-Authentifizierung, wenn verfügbar
- Beschränken Sie Zugriffe auf Backend-APIs über eine Firewall
- Überprüfen Sie regelmäßig die Logs auf verdächtige Aktivitäten