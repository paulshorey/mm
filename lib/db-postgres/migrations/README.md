# Postgres Migrations

This directory is the canonical schema history for `POSTGRES_URL`.

## Baseline

- `202602180130__baseline.sql` is generated from the live database snapshot.
- For existing databases that already contain this schema, mark it applied with:
  - `pnpm --filter @lib/db-postgres db:migrate:baseline`

## Naming

Use immutable ordered files:

- `YYYYMMDDHHMM__description.sql`

Example:

- `202602171200__create_log_order_strength_tables.sql`

## Rules

- Never edit an applied migration.
- Add a new migration for every schema change.
- Keep migrations SQL-first so all language clients can consume the same contract.

## Typical flow

1. Create migration:
   - `pnpm --filter @lib/db-postgres db:migration:new -- add_order_status`
2. Edit the new SQL file in this folder.
3. Apply to target DB:
   - `pnpm --filter @lib/db-postgres db:migrate`
4. Refresh schema snapshot + generated types:
   - `pnpm --filter @lib/db-postgres db:schema:snapshot`
   - `pnpm --filter @lib/db-postgres db:types:generate`
