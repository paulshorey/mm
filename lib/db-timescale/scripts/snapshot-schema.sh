#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TIMESCALE_URL:-}" ]]; then
  echo "TIMESCALE_URL is required"
  exit 1
fi

pg_dump "$TIMESCALE_URL" \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  > schema/current.sql

echo "Wrote schema/current.sql"
