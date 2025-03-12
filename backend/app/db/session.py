from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Datenbankverbindung erstellen
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency für FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 