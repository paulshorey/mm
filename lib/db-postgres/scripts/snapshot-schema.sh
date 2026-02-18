#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${POSTGRES_URL:-}" ]]; then
  echo "POSTGRES_URL is required"
  exit 1
fi

pg_dump "$POSTGRES_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  > schema/current.sql

echo "Wrote schema/current.sql"
