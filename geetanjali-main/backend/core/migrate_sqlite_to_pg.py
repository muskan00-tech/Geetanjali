"""
Automated Data Migration Script: SQLite to PostgreSQL.
Transfers all existing salon data, staff salaries, POS transactions, SKUs, and config from SQLite to PostgreSQL.
"""
import sqlite3
import logging
import asyncio
import json
from sqlalchemy import text
from core.pg_database import _engine, Base, create_engine_and_session
import core.pg_models  # Ensures all ORM models are registered

log = logging.getLogger("lss.migration")

# Table ordering to satisfy foreign keys if any
TABLE_ORDER = [
    "users",
    "staff",
    "skus",
    "vendors",
    "app_config",
    "app_flags",
    "checkouts",
    "sku_batches",
    "pos_transactions",
    "pos_transaction_staff",
    "payouts",
    "purchase_invoices",
    "purchase_invoice_lines",
    "attendance",
    "stock_audits",
    "stock_audit_items",
    "service_recipes",
    "recipe_ingredients",
    "service_consumption_log",
    "budgets",
    "budget_line_items",
    "purchase_orders_v2",
    "po_lines",
    "po_status_history",
    "vendor_contracts",
    "stock_ledger",
    "product_incentive_mappings"
]

async def migrate_data_sqlite_to_pg(sqlite_db_path: str = "geetanjali.db", pg_url: str = None):
    """
    Migrates all table data from SQLite into PostgreSQL.
    """
    if pg_url:
        create_engine_and_session(pg_url)

    log.info("Starting SQLite -> PostgreSQL data migration...")
    
    # 1. Create all PostgreSQL tables
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # 2. Connect to SQLite
    sqlite_conn = sqlite3.connect(sqlite_db_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Get available tables in SQLite
    sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    available_tables = set(row[0] for row in sqlite_cursor.fetchall())

    migrated_counts = {}

    async with _engine.begin() as pg_conn:
        for table in TABLE_ORDER:
            if table not in available_tables:
                continue

            # Fetch SQLite rows
            sqlite_cursor.execute(f"SELECT * FROM [{table}]")
            rows = sqlite_cursor.fetchall()
            if not rows:
                migrated_counts[table] = 0
                continue

            columns = list(rows[0].keys())
            
            # Read existing PG count to avoid duplicating if already migrated
            count_res = await pg_conn.execute(text(f"SELECT COUNT(*) FROM [{table}]" if _engine.dialect.name == "sqlite" else f'SELECT COUNT(*) FROM "{table}"'))
            pg_count = count_res.scalar() or 0
            if pg_count > 0:
                log.info(f"Table '{table}' already contains {pg_count} rows in PostgreSQL. Skipping duplicate insert.")
                migrated_counts[table] = pg_count
                continue

            # Prepare insert statement
            cols_str = '", "'.join(columns)
            placeholders = ', '.join([f":{col}" for col in columns])
            insert_query = text(f'INSERT INTO "{table}" ("{cols_str}") VALUES ({placeholders})')

            # Convert row data
            batch_data = []
            for r in rows:
                row_dict = dict(r)
                # Handle JSON strings for JSON columns if needed
                for k, v in row_dict.items():
                    if isinstance(v, str) and (v.startswith('{') or v.startswith('[')):
                        try:
                            row_dict[k] = json.loads(v)
                        except Exception:
                            pass
                batch_data.append(row_dict)

            # Insert batch into PostgreSQL
            await pg_conn.execute(insert_query, batch_data)
            migrated_counts[table] = len(batch_data)
            log.info(f"Migrated {len(batch_data)} rows for table '{table}' into PostgreSQL.")

    sqlite_conn.close()
    log.info("SQLite -> PostgreSQL migration complete successfully!")
    return migrated_counts

if __name__ == "__main__":
    import sys
    db_path = sys.argv[1] if len(sys.argv) > 1 else "geetanjali.db"
    asyncio.run(migrate_data_sqlite_to_pg(db_path))
