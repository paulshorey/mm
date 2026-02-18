# @lib/db-postgres

Database-first package for the `POSTGRES_URL` database.

## Source of truth

- `migrations/`: canonical schema change history
- `schema/current.sql`: generated snapshot of expected schema
- `queries/`: language-agnostic SQL query contracts

## TypeScript adapter

- `lib/db/postgres.ts`: connection accessor for app/runtime code
- `sql/*`: table-specific query helpers and types used by current TypeScript apps.

## Notes

- Keep SQL and migration contracts database-first; generated language bindings are derived artifacts.
- Keep `sql/*` helpers focused on database access only (query shape, serialization, SQL defaults).
- Do not import `@lib/common` from this package. Runtime concerns like request IP lookup, response formatting, and SMS alerts belong in apps or `@lib/common`.
