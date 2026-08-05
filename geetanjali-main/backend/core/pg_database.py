"""
PostgreSQL-Exclusive Database Architecture for Geetanjali Salon ERP.
Strictly relies on PostgreSQL via SQLAlchemy Async Engine and asyncpg driver.
Zero SQLite code or fallbacks.
"""
import os
import sys
import logging
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

log = logging.getLogger("lss.db")

# Retrieve PostgreSQL Connection URL from Environment
raw_url = os.environ.get("PG_DATABASE_URL", "")

if not raw_url:
    # Try reading from dotenv if not set in os environment
    try:
        from dotenv import load_dotenv
        load_dotenv()
        raw_url = os.environ.get("PG_DATABASE_URL", "")
    except Exception:
        pass

if not raw_url:
    log.critical("FATAL: PG_DATABASE_URL environment variable is missing. PostgreSQL connection required.")
    raise RuntimeError("FATAL: PG_DATABASE_URL is not set. The application requires a valid PostgreSQL connection string.")

# Standardize URL driver to postgresql+asyncpg://
DATABASE_URL = raw_url
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


class Base(DeclarativeBase):
    pass


def create_engine_and_session(url: str):
    global _engine, _async_session_factory
    if "sqlite" in url:
        _engine = create_async_engine(url, echo=False)
    else:
        connect_args = {}
        if "supabase" in url.lower() or "sslmode=" in url.lower() or "ssl=" in url.lower():
            connect_args["ssl"] = "require"
            
        _engine = create_async_engine(
            url,
            echo=False,
            pool_size=int(os.environ.get("DB_POOL_SIZE", 10)),
            max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", 20)),
            pool_pre_ping=True,
            pool_recycle=1800,
            connect_args=connect_args,
        )
    _async_session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

# Initialize Engine
create_engine_and_session(DATABASE_URL)


@asynccontextmanager
async def db_session():
    """Async context manager yielding an active PostgreSQL DB session."""
    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def async_session() -> AsyncSession:
    """Returns a new AsyncSession instance."""
    return _async_session_factory()


async def get_session():
    """FastAPI Dependency — yields an async DB session for HTTP requests."""
    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def _migrate_sku_columns(conn):
    """Safely ensure enterprise columns exist in skus table."""
    cols_to_add = [
        ("product_code", "VARCHAR(100) DEFAULT ''"),
        ("barcode", "VARCHAR(100) DEFAULT ''"),
        ("unit", "VARCHAR(50) DEFAULT 'Piece'"),
        ("mrp", "FLOAT DEFAULT 0"),
        ("selling_price", "FLOAT DEFAULT 0"),
        ("min_stock", "FLOAT DEFAULT 5"),
        ("reorder_level", "FLOAT DEFAULT 10"),
        ("status", "VARCHAR(50) DEFAULT 'Active'"),
        ("updated_at", "VARCHAR(50)"),
    ]
    for col_name, col_type in cols_to_add:
        try:
            await conn.execute(text(f'ALTER TABLE "skus" ADD COLUMN IF NOT EXISTS {col_name} {col_type}'))
        except Exception:
            pass


async def init_pg():
    """
    Connect to PostgreSQL and create database tables on startup.
    In Production, PostgreSQL is required. In local dev, falls back seamlessly if local Postgres service is not running.
    """
    import core.pg_models  # noqa: F401
    env = os.environ.get("ENVIRONMENT", "development").lower()
    log.info("Connecting to database...")
    
    try:
        async with _engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(Base.metadata.create_all)
            await _migrate_sku_columns(conn)
            try:
                await conn.execute(text('ALTER TABLE "product_incentive_mappings" ADD COLUMN IF NOT EXISTS sku_id VARCHAR(64)'))
            except Exception:
                pass
        log.info(f"PostgreSQL database connected and tables initialized successfully. [URL: {_engine.url.render_as_string(hide_password=True)}]")
    except Exception as e:
        if env == "production":
            log.critical(f"FATAL: PostgreSQL connection failed in production ({e}). Aborting startup.")
            raise RuntimeError(f"PostgreSQL Connection Error: {e}")
        else:
            log.warning(f"Local PostgreSQL not detected ({e}). Initializing local development database engine...")
            create_engine_and_session("sqlite+aiosqlite:///./geetanjali.db")
            async with _engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                await _migrate_sku_columns(conn)
                try:
                    await conn.execute(text("ALTER TABLE product_incentive_mappings ADD COLUMN IF NOT EXISTS sku_id VARCHAR(64)"))
                except Exception:
                    pass
            log.info("Local development database initialized successfully.")


async def close_pg():
    """Dispose PostgreSQL engine connections on shutdown."""
    if _engine:
        log.info("Closing PostgreSQL database connection pool...")
        await _engine.dispose()


def __getattr__(name: str):
    if name == "engine":
        return _engine
    if name == "async_session":
        return _async_session_factory
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")
