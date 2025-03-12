#!/usr/bin/env python
"""
Skript zur Erstellung eines Admin-Benutzers.
Dieses Skript kann verwendet werden, um einen Administrator-Benutzer in der Datenbank zu erstellen.
"""

import argparse
import os
import sys
from pathlib import Path

# Füge das Projekt-Root-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.config import settings
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserRole
from sqlalchemy.exc import IntegrityError

def create_admin_user(username, email, password, first_name=None, last_name=None):
    """Erstellt einen neuen Admin-Benutzer in der Datenbank"""
    db = SessionLocal()
    try:
        # Prüfen, ob der Benutzer bereits existiert
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"Fehler: Ein Benutzer mit dem Benutzernamen '{username}' oder der E-Mail '{email}' existiert bereits.")
            return False
        
        # Admin-Benutzer erstellen
        db_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            first_name=first_name or username,
            last_name=last_name or "",
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        print(f"Admin-Benutzer '{username}' wurde erfolgreich erstellt!")
        return True
    
    except IntegrityError as e:
        db.rollback()
        print(f"Fehler: {e}")
        return False
    
    except Exception as e:
        db.rollback()
        print(f"Ein unerwarteter Fehler ist aufgetreten: {e}")
        return False
    
    finally:
        db.close()

def main():
    """Hauptfunktion für die Befehlszeilenausführung"""
    parser = argparse.ArgumentParser(description="Admin-Benutzer erstellen")
    parser.add_argument("--username", required=True, help="Benutzername")
    parser.add_argument("--email", required=True, help="E-Mail-Adresse")
    parser.add_argument("--password", required=True, help="Passwort")
    parser.add_argument("--first-name", help="Vorname")
    parser.add_argument("--last-name", help="Nachname")
    
    args = parser.parse_args()
    
    success = create_admin_user(
        username=args.username,
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 