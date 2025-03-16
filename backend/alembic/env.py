import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text

from alembic import context
from app.core.config import settings

# TODO: Bei der nächsten Migration das is_brandenburg-Flag aus dem TenantModel entfernen,
# da es durch den generischen XML-Import ersetzt wurde.

# TODO: Entfernen Sie die is_brandenburg-Flag später aus dieser Datei
import logging
logger = logging.getLogger("alembic.env")

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from app.db.base_class import Base  # noqa
from app.models.token import TokenBlacklist  # noqa
from app.models.user import User, user_tenant  # noqa
from app.models.agency import Agency, agency_tenant  # noqa
from app.models.tenant import Tenant  # noqa

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def get_url():
    # Container-Name aus Docker-Compose verwenden, nicht localhost
    postgres_host = os.environ.get("POSTGRES_SERVER", "db")
    postgres_port = os.environ.get("POSTGRES_PORT", "5432") 
    postgres_user = os.environ.get("POSTGRES_USER", "postgres")
    postgres_password = os.environ.get("POSTGRES_PASSWORD", "postgres")
    postgres_db = os.environ.get("POSTGRES_DB", "smg_dialog")
    
    return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        # Deaktiviere die Transaktionsverwaltung für die Migration, 
        # damit ein Fehler in einer Migration nicht alle folgenden Migrationen abbricht
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            transaction_per_migration=True
        )

        # Führe die Migrationen aus
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 