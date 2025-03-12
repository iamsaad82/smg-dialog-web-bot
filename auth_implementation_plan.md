# Implementierungsplan für die Authentifizierung im SMG-Dialog-Web-Bot

## 1. Backend-Implementierung

### 1.1. Authentifizierungsendpunkte erweitern

Wir beginnen mit der Erweiterung des Backends, um grundlegende Authentifizierungsendpunkte bereitzustellen:

```
backend/app/api/v1/auth.py
```
Hier implementieren wir:
- Login-Endpunkt (`/auth/login`)
- Logout-Endpunkt (`/auth/logout`)
- Token-Refresh-Endpunkt (`/auth/refresh`)
- Passwort-Reset-Endpunkte (`/auth/reset-password`, `/auth/reset-password-confirm`)

### 1.2. JWT-Implementierung

In `backend/app/core/security.py` erweitern wir die Sicherheitsfunktionen:
- Token-Generierung (Access und Refresh Tokens)
- Token-Validierung
- Passwort-Hashing und Verifikation

### 1.3. Benutzer-Datenbankmodelle

In `backend/app/models`:
- Erweiterung des Benutzermodells um Authentifizierungsfelder (Passwort-Hash, letzte Anmeldung)
- Token-Blacklist-Modell für abgemeldete Tokens

### 1.4. Benutzer-Service

In `backend/app/services`:
- Implementierung eines Benutzerdienstes für Authentifizierung und Autorisierung
- Implementierung von Passwort-Reset-Funktionen

### 1.5. Dependencies für geschützte Routen

In `backend/app/core/deps.py`:
- Implementierung von Abhängigkeitsfunktionen für den Zugriff auf den aktuellen Benutzer
- Rollenbasierte Zugriffskontrolle für verschiedene Endpunkte

## 2. Frontend-Implementierung

### 2.1. Authentifizierungskontext

In `frontend/src/contexts`:
- Implementierung eines `AuthContext` mit React Context API
- Bereitstellung von Login/Logout-Funktionen 
- Speicherung des Authentifizierungsstatus und der Benutzerinformationen

### 2.2. Authentifizierungs-API

Erweiterung von `frontend/src/api/index.ts` und Erstellung von `frontend/src/api/auth.ts`:
- Login-Funktion
- Logout-Funktion
- Token-Refresh-Funktion
- Passwort-Reset-Funktionen

### 2.3. Login-Komponenten

In `frontend/src/components/auth`:
- Login-Formular
- Registrierungsformular (falls benötigt)
- Passwort-Reset-Formulare

### 2.4. Login-Seite

In `frontend/src/pages/auth`:
- Login-Seite
- Passwort-Reset-Seiten

### 2.5. Geschützte Routen

In `frontend/src/components/layouts`:
- Implementierung einer `ProtectedLayout`-Komponente
- Integration der Rollenbasierten Zugriffskontrolle

### 2.6. Profilseite

In `frontend/src/pages/profile`:
- Benutzerprofilseite für Kontoeinstellungen
- Passwortänderungsmöglichkeit

## 3. Detaillierter Implementierungsplan

Hier ist ein Schritt-für-Schritt-Plan mit konkreten Datei- und Funktionsbeschreibungen:

### Schritt 1: Backend-Modelle und -Dienste

1. Erweiterung des Benutzermodells in `backend/app/models/user.py`
2. Implementierung des Auth-Services in `backend/app/services/auth_service.py`
3. Erweiterung des Benutzerdienstes in `backend/app/services/user_service.py`

### Schritt 2: JWT-Implementierung im Backend

1. Erweitern von `backend/app/core/security.py` um JWT-Funktionen
2. Erstellen von `backend/app/core/deps.py` für Abhängigkeiten

### Schritt 3: Backend-Authentifizierungsendpunkte

1. Implementierung von `backend/app/api/v1/auth.py`
2. Aktualisierung der API-Router in `backend/app/api/v1/__init__.py`

### Schritt 4: Frontend-Authentifizierungskontext

1. Implementierung von `frontend/src/contexts/AuthContext.tsx`
2. Integration in `frontend/src/pages/_app.tsx`

### Schritt 5: Frontend-Authentifizierungs-API

1. Implementierung von `frontend/src/api/auth.ts`
2. Aktualisierung von `frontend/src/api/index.ts`

### Schritt 6: Login-Komponenten und -Seiten

1. Implementierung der Login-Komponenten in `frontend/src/components/auth/`
2. Implementierung der Login-Seite in `frontend/src/pages/auth/login.tsx`

### Schritt 7: Geschützte Routen und Layouts

1. Implementierung von `frontend/src/components/layouts/ProtectedLayout.tsx`
2. Aktualisierung der bestehenden Seiten zur Verwendung des geschützten Layouts

### Schritt 8: Profilseite und Benutzereinstellungen

1. Implementierung der Profilseite in `frontend/src/pages/profile/index.tsx`
2. Implementierung von Benutzereinstellungen in `frontend/src/components/profile/`

## 4. Migrationsplan

Um die Änderungen sicher in das bestehende System zu integrieren, schlage ich folgende Migrationsstrategie vor:

1. **Datenbankmigrationen**: Zuerst die Datenbankmodelle aktualisieren und die Migrationen ausführen
2. **Backend-Dienste**: Dann die Backend-Dienste implementieren und testen
3. **API-Endpunkte**: Die neuen Authentifizierungsendpunkte implementieren
4. **Frontend-Kontext**: Den Authentifizierungskontext im Frontend implementieren
5. **Login-Komponenten**: Die UI-Komponenten für Login/Logout implementieren
6. **Geschützte Routen**: Bestehende Routen schrittweise in geschützte Routen umwandeln

Diese schrittweise Migration ermöglicht es, die bestehende Funktionalität beizubehalten, während die neue Authentifizierungslogik implementiert wird. 