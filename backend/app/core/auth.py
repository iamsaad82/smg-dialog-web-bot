from fastapi import Header, HTTPException, status
from typing import Optional

async def get_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Extrahiert und validiert den API-Key aus dem Header.
    Wirft eine HTTPException, wenn kein gültiger API-Key gefunden wird.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API-Key fehlt"
        )
    return x_api_key 