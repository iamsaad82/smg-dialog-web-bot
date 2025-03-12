from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.services.user_service import UserService
from backend.models.user import User, UserCreate, UserResponse, UserRole
from backend.utils.auth import get_current_active_user
from backend.database.database import get_db

router = APIRouter()

@router.post("", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Erstellt einen neuen Benutzer
    """
    # Nur Administratoren und Agentur-Administratoren können Benutzer erstellen
    if current_user.role not in [UserRole.ADMIN, UserRole.AGENCY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Keine Berechtigung zum Erstellen von Benutzern",
        )
    
    # Agentur-Administratoren können nur Benutzer für ihre eigene Agentur erstellen
    if current_user.role == UserRole.AGENCY_ADMIN and user_create.agency_id != current_user.agency_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie können nur Benutzer für Ihre eigene Agentur erstellen",
        )
    
    # Agentur-Administratoren können keine weiteren Administratoren erstellen
    if current_user.role == UserRole.AGENCY_ADMIN and user_create.role in [UserRole.ADMIN, UserRole.AGENCY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie können keine Administratoren erstellen",
        )
    
    try:
        user = user_service.create_user(db, user_create, created_by_id=current_user.id)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Erstellen des Benutzers: {str(e)}",
        ) 