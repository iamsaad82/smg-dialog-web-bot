from fastapi import APIRouter

from app.api.v1 import auth, users, tenants, documents, chat, embed, structured_data

# Haupt-APIRouter, der alle Subrouter zusammenfasst
api_router = APIRouter()

# Auth-Routen
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# User-Management
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Tenant-Management
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])

# Dokumente
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])

# Chat
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

# Embedding-Funktionen
api_router.include_router(embed.router, prefix="/embed", tags=["embed"])

# Strukturierte Daten
api_router.include_router(structured_data.router, prefix="/structured-data", tags=["structured-data"]) 