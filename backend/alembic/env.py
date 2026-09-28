"""
Alembic Environment Configuration
===================================
Database URL .env se load hoti hai.
Sab models import kiye hain taaki autogenerate kaam kare.

Run migrations:
  cd backend
  alembic upgrade head

Generate new migration:
  cd backend
  alembic revision --autogenerate -m "your message"
"""

from logging.config import fileConfig
import sys
import os

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context


# ==========================================
# PATH FIX
# ==========================================
# backend/ folder ko Python path mein add karo
# taaki app.* imports kaam karein
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ==========================================
# IMPORTS
# ==========================================

from app.core.config import settings
from app.db.base import Base

# Sab models import karo taaki autogenerate unhe detect kar sake
from app.models.camera import Camera
from app.models.detection import Detection
from app.models.watchlist import Watchlist
from app.models.alert import Alert
from app.models.audit_log import AuditLog


# ==========================================
# ALEMBIC CONFIG
# ==========================================

config = context.config

# Database URL .env se set karo
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL
)

# Logging configure karo (alembic.ini se)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Autogenerate ke liye metadata
target_metadata = Base.metadata


# ==========================================
# OFFLINE MIGRATION (bina DB connection ke)
# ==========================================

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ==========================================
# ONLINE MIGRATION (DB se connect karke)
# ==========================================

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# ==========================================
# RUN
# ==========================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()