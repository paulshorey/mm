# Timescale Migrations

This directory is the canonical schema history for `TIMESCALE_URL`.

## Baseline

- `202602180131__baseline.sql` is generated from the live database snapshot.
- For existing databases that already contain this schema, mark it applied with:
  - `pnpm --filter @lib/db-timescale db:migrate:baseline`

## Naming

- `YYYYMMDDHHMM__description.sql`

## Rules

- Never edit applied migrations.
- Add forward-only migrations.
- Keep schema ownership here even if apps use raw SQL.

## Typical flow

1. Create migration:
   - `pnpm --filter @lib/db-timescale db:migration:new -- add_candles_15m_table`
2. Edit the new SQL file in this folder.
3. Apply to target DB:
   - `pnpm --filter @lib/db-timescale db:migrate`
4. Refresh schema snapshot + generated types:
   - `pnpm --filter @lib/db-timescale db:schema:snapshot`
   - `pnpm --filter @lib/db-timescale db:types:generate`
