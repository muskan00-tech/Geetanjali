#!/usr/bin/env bash
# ==============================================================================
# Automatic PostgreSQL Backup Script with Retention Policy
# Retention: 30 Daily Backups, 12 Monthly Backups
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/geetanjali}"
DATE=$(date +%Y-%m-%d_%H%M%S)
DAY_OF_MONTH=$(date +%d)
DAILY_DIR="${BACKUP_DIR}/daily"
MONTHLY_DIR="${BACKUP_DIR}/monthly"

mkdir -p "${DAILY_DIR}" "${MONTHLY_DIR}"

CONTAINER_NAME="geetanjali_postgres"
DB_USER="${POSTGRES_USER:-geetanjali_user}"
DB_NAME="${POSTGRES_DB:-geetanjali_db}"

BACKUP_FILE="${DAILY_DIR}/geetanjali_pg_${DATE}.sql.gz"

echo "[$(date)] Starting PostgreSQL Backup for database '${DB_NAME}'..."

# Run pg_dump inside container and compress output
if command -v docker >/dev/null 2>&1 && docker ps | grep -q "${CONTAINER_NAME}"; then
    docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
    pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

echo "[$(date)] Backup completed: ${BACKUP_FILE}"

# Archive monthly backup on the 1st of every month
if [ "${DAY_OF_MONTH}" -eq "01" ]; then
    MONTHLY_FILE="${MONTHLY_DIR}/geetanjali_pg_monthly_${DATE}.sql.gz"
    cp "${BACKUP_FILE}" "${MONTHLY_FILE}"
    echo "[$(date)] Monthly backup archived: ${MONTHLY_FILE}"
fi

# Apply Retention Policy:
# Delete daily backups older than 30 days
find "${DAILY_DIR}" -type f -name "geetanjali_pg_*.sql.gz" -mtime +30 -delete

# Delete monthly backups older than 365 days (12 months)
find "${MONTHLY_DIR}" -type f -name "geetanjali_pg_monthly_*.sql.gz" -mtime +365 -delete

echo "[$(date)] Backup retention policy enforced (30 daily / 12 monthly retained)."
