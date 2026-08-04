"""PostgreSQL async connection via SQLAlchemy (with automatic fallback to SQLite)."""
import os
import logging
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

log = logging.getLogger("lss.db")

DATABASE_URL = os.environ.get(
    "PG_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/geetanjali_db"
)

# Render (and many cloud providers) inject plain "postgresql://" or "postgres://"
# but SQLAlchemy async requires "postgresql+asyncpg://".
# Normalize the URL here so it always uses the asyncpg driver.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Global engine and session variables
_engine = None
_async_session_factory = None


class Base(DeclarativeBase):
    pass


def create_engine_and_session(url: str):
    global _engine, _async_session_factory
    # Keep it simple — no extra pool/SSL kwargs.
    # asyncpg manages its own pool; pool_size/max_overflow are not supported.
    # Render internal DB connections don't need explicit SSL (same private network).
    _engine = create_async_engine(url, echo=False)
    _async_session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


# Initialize default engine
create_engine_and_session(DATABASE_URL)



@asynccontextmanager
async def db_session():
    """Async context manager yielding a DB session."""
    async with _async_session_factory() as session:
        yield session


def async_session():
    """Returns a new AsyncSession instance."""
    return _async_session_factory()


async def get_session():
    """FastAPI Dependency — yields an async DB session."""
    async with _async_session_factory() as session:
        yield session


async def _migrate_sku_columns(conn):
    """Safely ensure new enterprise columns exist in skus table."""
    from sqlalchemy import text
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
            await conn.execute(text(f"ALTER TABLE skus ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass

async def init_pg():
    """Initialize PostgreSQL tables on startup and automatically migrate any existing SQLite data."""
    import core.pg_models  # noqa: F401
    import os
    from sqlalchemy import text
    
    try:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await _migrate_sku_columns(conn)
            try:
                await conn.execute(text("ALTER TABLE product_incentive_mappings ADD COLUMN sku_id VARCHAR(64)"))
            except Exception:
                pass
        log.info(f"PostgreSQL database initialized successfully with URL: {_engine.url}")
        
        # Auto-migrate data from local SQLite if available
        sqlite_paths = ["geetanjali.db", "backend/geetanjali.db", "../geetanjali.db"]
        found_sqlite = next((p for p in sqlite_paths if os.path.exists(p)), None)
        if found_sqlite:
            try:
                from core.migrate_sqlite_to_pg import migrate_data_sqlite_to_pg
                log.info(f"Existing SQLite database found at '{found_sqlite}'. Initiating auto-migration to PostgreSQL...")
                await migrate_data_sqlite_to_pg(found_sqlite)
            except Exception as mig_err:
                log.warning(f"SQLite -> PostgreSQL migration warning: {mig_err}")
    except Exception as e:
        log.error(f"Failed to connect to PostgreSQL ({e}). Please ensure PostgreSQL is running or set PG_DATABASE_URL.")
        raise e


async def close_pg():
    """Dispose the engine on shutdown."""
    if _engine:
        await _engine.dispose()


def __getattr__(name: str):
    if name == "engine":
        return _engine
    if name == "async_session":
        return _async_session_factory
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

