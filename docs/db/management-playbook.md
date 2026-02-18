# Database Management Playbook

This is the operational guide for database-first schema management in this monorepo.

## Packages and source of truth

- `@lib/db-postgres` owns `POSTGRES_URL`
- `@lib/db-timescale` owns `TIMESCALE_URL`
- Source of truth is:
  - `migrations/*.sql` (history)
  - `schema/current.sql` (current snapshot)
  - `queries/**/*.sql` (query contracts)

Generated files in `generated/*` are derived artifacts, not the source of truth.

## Environment setup

Before running package scripts, export the correct DB URL:

- Postgres: `POSTGRES_URL`
- Timescale: `TIMESCALE_URL`

The app `.env` files already contain these values.

## First-time setup for existing databases

Both DB packages include a baseline migration generated from the live DB:

- `lib/db-postgres/migrations/202602180130__baseline.sql`
- `lib/db-timescale/migrations/202602180131__baseline.sql`

For a database that already has this schema, mark baseline migrations as applied:

```bash
pnpm --filter @lib/db-postgres db:migrate:baseline
pnpm --filter @lib/db-timescale db:migrate:baseline
```

Do this once per database environment.

## Add or edit a column

Example: add column `status` to `order_v1`.

1. Create migration:
   ```bash
   pnpm --filter @lib/db-postgres db:migration:new -- add_order_status
   ```
2. Edit the new migration file:
   ```sql
   BEGIN;
   ALTER TABLE public.order_v1 ADD COLUMN status text;
   COMMIT;
   ```
3. Apply migration:
   ```bash
   pnpm --filter @lib/db-postgres db:migrate
   ```
4. Refresh contracts:
   ```bash
   pnpm --filter @lib/db-postgres db:schema:snapshot
   pnpm --filter @lib/db-postgres db:types:generate
   ```
5. Update query contracts in `lib/db-postgres/queries/*` if needed.
6. Update adapters (`lib/db-postgres/sql/*`) to read/write the new column.

## Add a new table

1. Create migration:
   ```bash
   pnpm --filter @lib/db-postgres db:migration:new -- create_positions_v1
   ```
2. Write forward-only SQL:
   ```sql
   BEGIN;
   CREATE TABLE public.positions_v1 (
     id bigserial PRIMARY KEY,
     ticker text NOT NULL,
     size numeric NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   );
   CREATE INDEX positions_v1_ticker_created_at_idx ON public.positions_v1 (ticker, created_at DESC);
   COMMIT;
   ```
3. Apply migration, refresh snapshot/types, then add query contracts and adapters.

## TypeScript enforcement strategy

Generated files:

- `lib/db-postgres/generated/typescript/db-types.ts`
- `lib/db-timescale/generated/typescript/db-types.ts`

How to enforce:

1. Regenerate after every migration (`db:types:generate`).
2. Import generated row types in adapter code where practical.
3. Run `pnpm build` in CI; any adapter code out of sync with updated generated types should fail type-check.
4. Require a diff in:
   - `migrations/*.sql`
   - `schema/current.sql`
   - `generated/typescript/db-types.ts`
   for schema-related PRs.

## Recommended PR checklist for schema changes

- [ ] New migration added (no edits to already-applied migrations)
- [ ] Migration applied successfully in target environment
- [ ] `schema/current.sql` updated
- [ ] `generated/typescript/db-types.ts` updated
- [ ] Relevant `queries/*.sql` updated
- [ ] Relevant `sql/*` adapters updated
- [ ] `pnpm build` passes

## Script reference

Postgres package:

- `pnpm --filter @lib/db-postgres db:migration:new -- <name>`
- `pnpm --filter @lib/db-postgres db:migrate`
- `pnpm --filter @lib/db-postgres db:migrate:baseline`
- `pnpm --filter @lib/db-postgres db:schema:snapshot`
- `pnpm --filter @lib/db-postgres db:types:generate`

Timescale package:

- `pnpm --filter @lib/db-timescale db:migration:new -- <name>`
- `pnpm --filter @lib/db-timescale db:migrate`
- `pnpm --filter @lib/db-timescale db:migrate:baseline`
- `pnpm --filter @lib/db-timescale db:schema:snapshot`
- `pnpm --filter @lib/db-timescale db:types:generate`
