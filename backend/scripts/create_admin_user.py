#!/usr/bin/env python3
"""
Skript zum Erstellen eines Admin-Benutzers.
Verwendung: python create_admin_user.py <username> <email> <password>
"""
import sys
import os
import argparse
from sqlalchemy.orm import Session

# Sicherstellen, dass das übergeordnete Verzeichnis im Python-Pfad ist
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.services.user_service import user_service
from app.models.user import UserRole


def create_admin_user(username: str, email: str, password: str, first_name: str, last_name: str):
    """Erstellt einen neuen Admin-Benutzer in der Datenbank."""
    db = SessionLocal()
    try:
        # Prüfen, ob der Benutzer bereits existiert
        existing_user = user_service.get_user_by_username(db, username)
        if existing_user:
            print(f"Ein Benutzer mit dem Benutzernamen '{username}' existiert bereits.")
            return False
        
        existing_email = user_service.get_user_by_email(db, email)
        if existing_email:
            print(f"Ein Benutzer mit der E-Mail-Adresse '{email}' existiert bereits.")
            return False
        
        # Benutzer erstellen
        user = user_service.create_user(
            db=db,
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        print(f"Admin-Benutzer '{username}' wurde erfolgreich erstellt mit ID: {user.id}")
        return True
    
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Erstellt einen Admin-Benutzer")
    parser.add_argument("username", help="Benutzername des Admin-Benutzers")
    parser.add_argument("email", help="E-Mail-Adresse des Admin-Benutzers")
    parser.add_argument("password", help="Passwort des Admin-Benutzers")
    parser.add_argument("first_name", help="Vorname des Admin-Benutzers")
    parser.add_argument("last_name", help="Nachname des Admin-Benutzers")
    
    args = parser.parse_args()
    
    create_admin_user(
        username=args.username,
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name
    ) 