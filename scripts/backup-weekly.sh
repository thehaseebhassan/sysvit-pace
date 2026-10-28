#!/usr/bin/env bash
# Weekly export for Supabase Free (no automatic backups).
# Usage: SUPABASE_DB_URL='postgresql://postgres:***@db.<ref>.supabase.co:5432/postgres' ./scripts/backup-weekly.sh
# Needs the Supabase CLI (installed via npm) and Docker, or pg_dump on PATH.
set -euo pipefail

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL (Project settings > Database > Connection string)}"
OUT_DIR="${BACKUP_DIR:-backups}"
STAMP="$(date +%Y-%m-%d)"
mkdir -p "$OUT_DIR"

npx supabase db dump --db-url "$SUPABASE_DB_URL" -f "$OUT_DIR/schema-$STAMP.sql"
npx supabase db dump --db-url "$SUPABASE_DB_URL" --data-only --use-copy -f "$OUT_DIR/data-$STAMP.sql"

echo "Backup written to $OUT_DIR/ (schema-$STAMP.sql, data-$STAMP.sql)."
echo "Copy these off this machine (e.g. cloud drive). backups/ is gitignored."
