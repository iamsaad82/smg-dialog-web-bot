#!/usr/bin/env python3
"""
Admin-Token-Generator für den Brandenburg XML-Import

Dieses Skript generiert einen langlebigen JWT-Token für einen Admin-Benutzer,
der für den Brandenburg XML-Import-Cronjob verwendet werden kann.

Umgebungsvariablen:
- ADMIN_USERNAME: Benutzername des Admin-Benutzers
- ADMIN_PASSWORD: Passwort des Admin-Benutzers
- JWT_SECRET_KEY: Geheimer Schlüssel für die JWT-Signatur (optional)
- TOKEN_EXPIRY_DAYS: Gültigkeitsdauer des Tokens in Tagen (optional, Standard: 365)
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
sys.path.append(str(ROOT_DIR))

# Import der Projektmodule
from app.core.security import create_jwt_token, verify_password
from app.db.session import SessionLocal
from app.db.models import UserModel

# Konfigurationsvariablen
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
TOKEN_EXPIRY_DAYS = int(os.getenv("TOKEN_EXPIRY_DAYS", "365"))


def get_admin_user(username: str) -> UserModel:
    """
    Ermittelt einen Admin-Benutzer aus der Datenbank.
    
    Args:
        username: Benutzername des Admin-Benutzers
        
    Returns:
        UserModel: Admin-Benutzer oder None
    """
    db = SessionLocal()
    user = db.query(UserModel).filter(
        UserModel.email == username,
        UserModel.is_admin == True
    ).first()
    db.close()
    return user


def generate_admin_token() -> str:
    """
    Generiert einen langlebigen JWT-Token für einen Admin-Benutzer.
    
    Returns:
        str: JWT-Token
    """
    if not ADMIN_USERNAME:
        print("Fehler: ADMIN_USERNAME ist nicht gesetzt.")
        return None
        
    if not ADMIN_PASSWORD:
        print("Fehler: ADMIN_PASSWORD ist nicht gesetzt.")
        return None
    
    # Admin-Benutzer aus der Datenbank holen
    admin_user = get_admin_user(ADMIN_USERNAME)
    if not admin_user:
        print(f"Fehler: Admin-Benutzer '{ADMIN_USERNAME}' nicht gefunden.")
        return None
    
    # Passwort überprüfen
    if not verify_password(ADMIN_PASSWORD, admin_user.hashed_password):
        print("Fehler: Falsches Passwort.")
        return None
    
    # Token generieren
    token_data = {
        "sub": str(admin_user.id),
        "email": admin_user.email,
        "is_admin": admin_user.is_admin,
        "type": "access"
    }
    
    token = create_jwt_token(
        data=token_data,
        expires_delta=timedelta(days=TOKEN_EXPIRY_DAYS)
    )
    
    # Ablaufdatum ermitteln
    expiry_date = datetime.utcnow() + timedelta(days=TOKEN_EXPIRY_DAYS)
    
    return token, expiry_date.strftime("%Y-%m-%d %H:%M:%S UTC")


def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description="Admin-Token für den Brandenburg XML-Import generieren")
    parser.add_argument("--output", help="Datei zum Speichern des Tokens (optional)")
    
    args = parser.parse_args()
    
    # Token generieren
    result = generate_admin_token()
    if not result:
        sys.exit(1)
        
    token, expiry = result
    
    # Ausgabe
    output = {
        "token": token,
        "expires": expiry,
        "usage": "Fügen Sie diesen Token als ADMIN_API_KEY in Ihren Render-Cronjob ein."
    }
    
    # In Datei speichern oder auf Konsole ausgeben
    if args.output:
        with open(args.output, "w") as f:
            json.dump(output, f, indent=2)
        print(f"Token in Datei '{args.output}' gespeichert.")
    else:
        print(json.dumps(output, indent=2))
    
    print(f"\nDer Token ist gültig bis {expiry}.")
    print("Verwenden Sie diesen Token als ADMIN_API_KEY in Ihrem Render-Cronjob.")
    print("WICHTIG: Behandeln Sie diesen Token vertraulich!")


if __name__ == "__main__":
    main() 