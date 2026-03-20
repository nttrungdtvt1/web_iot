#!/usr/bin/env bash
# ============================================================
# backup_script.sh
# Automated backup for Smart Door database.
# Supports both PostgreSQL (production) and SQLite (development).
#
# Usage:
#   chmod +x backup_script.sh
#   ./backup_script.sh
#
# Cron (daily at 2 AM):
#   0 2 * * * /path/to/web_app/database/backup_script.sh >> /var/log/smartdoor_backup.log 2>&1
# ============================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/smartdoor}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL="${DATABASE_URL:-sqlite:///./backend/smart_door.db}"

# ─── Setup ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "======================================"
echo "Smart Door Backup — $(date)"
echo "======================================"

# ─── PostgreSQL backup ────────────────────────────────────────
backup_postgres() {
    echo "[INFO] Backing up PostgreSQL database..."

    # Parse connection string: postgresql://user:pass@host:port/dbname
    DB_URL="${DATABASE_URL#postgresql://}"
    DB_USER="${DB_URL%%:*}"
    DB_URL="${DB_URL#*:}"
    DB_PASS="${DB_URL%%@*}"
    DB_URL="${DB_URL#*@}"
    DB_HOST="${DB_URL%%:*}"
    DB_URL="${DB_URL#*:}"
    DB_PORT="${DB_URL%%/*}"
    DB_NAME="${DB_URL#*/}"

    BACKUP_FILE="${BACKUP_DIR}/postgres_${DB_NAME}_${TIMESTAMP}.sql.gz"

    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        --format=custom \
    | gzip > "$BACKUP_FILE"

    echo "[OK] PostgreSQL backup saved: $BACKUP_FILE"
    echo "[INFO] Size: $(du -sh "$BACKUP_FILE" | cut -f1)"
}

# ─── SQLite backup ────────────────────────────────────────────
backup_sqlite() {
    echo "[INFO] Backing up SQLite database..."

    # Extract file path from URL (sqlite:///./path/to/file.db)
    SQLITE_PATH="${DATABASE_URL#sqlite:///}"
    SQLITE_PATH="${SQLITE_PATH#./}"

    if [ ! -f "$SQLITE_PATH" ]; then
        echo "[WARN] SQLite file not found: $SQLITE_PATH"
        return 1
    fi

    BACKUP_FILE="${BACKUP_DIR}/sqlite_${TIMESTAMP}.db.gz"

    # Use sqlite3 backup command for consistency (handles WAL mode)
    sqlite3 "$SQLITE_PATH" ".backup '${BACKUP_DIR}/sqlite_${TIMESTAMP}.db'"
    gzip "${BACKUP_DIR}/sqlite_${TIMESTAMP}.db"

    echo "[OK] SQLite backup saved: $BACKUP_FILE"
    echo "[INFO] Size: $(du -sh "$BACKUP_FILE" | cut -f1)"
}

# ─── Run appropriate backup ───────────────────────────────────
if [[ "$DATABASE_URL" == postgresql* ]]; then
    backup_postgres
elif [[ "$DATABASE_URL" == sqlite* ]]; then
    backup_sqlite
else
    echo "[ERROR] Unknown DATABASE_URL format: $DATABASE_URL"
    exit 1
fi

# ─── Cleanup old backups ──────────────────────────────────────
echo "[INFO] Removing backups older than ${RETAIN_DAYS} days..."
find "$BACKUP_DIR" -name "*.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[OK] Cleanup done"

echo "[DONE] Backup completed at $(date)"
