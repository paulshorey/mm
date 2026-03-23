# This project is a monorepo of trading and financial data apps. It uses TurboRepo to build, test, and deploy.

## Folder structure

### Apps `./apps/`

- `view-next` - TypeScript app to display financial charts and data analysis visualizations
- `write-node` - TypeScript server that connects to data providers, ingests price and volume data per trade, calculates indicators, aggregates candles and higher timeframes for backtestsing
- `tradingview-node` - Node.js/Express API for TradingView webhook ingest and strength reads
- `log-next` - logging and observability dashboard

### Shared Libraries `./lib/`

- `common` shared utilities
- `config` shared tooling
- `db-trading` database contracts for TRADING_DB
- `db-timescale` database contracts for TIMESCALE_DB

## Root database scripts

From the repo root, `pnpm db:migrate`, `pnpm db:verify`, and `pnpm db:migrate-and-verify` run via Turborepo (`turbo run …`) in every workspace package that defines those scripts (currently `@lib/db-trading` and `@lib/db-timescale`). Other packages are skipped. Set `TRADING_DB_URL` and/or `TIMESCALE_DB_URL` as needed. `pnpm dbs` is an alias for `pnpm db:migrate-and-verify`.

## DB package contract model

For each DB package:

- `migrations/` = canonical migration history
- `schema/current.sql` = generated schema snapshot
- `queries/` = language-agnostic SQL contracts
- `generated/` = generated artifacts for language clients
- runtime adapters live in `sql/*` and/or `lib/db/*`

## Import and boundary rules

In apps:

- Use `@/` for same-app imports.
- Use `@lib/common/...` for shared non-DB utilities.
- Use `@lib/db-trading/...` and `@lib/db-timescale/...` for DB contracts/helpers.

In `lib/*` packages:

- Use relative imports.
- Do not rewrite import paths unless files were moved.

## Operational rules for agent work

- Always use `pnpm` (never `npm`)
- Use `pnpm --filter <app> <command>` or `cd apps/<app> && pnpm run <command>`
- Never add `pnpm install` / `pnpm i` inside package-level `build`, `dev`, `test`, or `start` scripts. Install dependencies from the workspace root only.
- For focused work on one app or package, install from the root with a filter that includes that target plus its workspace dependencies, for example:
  - `pnpm run deps:install -- view-next...`
  - `pnpm run deps:install -- @lib/config...`
- Use a full root install (`pnpm run deps:install`) when running repo-wide commands such as `pnpm build`, when touching multiple apps, or when changing shared workspace dependencies.
- If request is ambiguous or contradictory, ask for clarification

Cloud agent:

- `cloud:install` installs PostgreSQL 17 client tools (`psql`, `pg_dump`) so `db:verify` and `db:migrate-and-verify` (schema snapshot) run without manual apt setup. `db:migrate` only needs the Node `pg` client.

DB operations:

- `db:migrate` applies pending migrations to the database at `TRADING_DB_URL` / `TIMESCALE_DB_URL`.
- `db:verify` snapshots the live DB, regenerates contract artifacts, runs SQL checks, and fails if `git diff` shows drift.
- `db:migrate-and-verify` chains `migrate.mjs && verify.mjs`. Use it after adding or editing migrations.
- Agents should run `db:migrate-and-verify` when they add or change migrations, and `db:verify` to confirm the repo matches the live DB. If verify fails on `git diff`, commit the regenerated artifacts.
- Before running, confirm the `*_DB_URL` env var is set and the host is reachable.

## Finish task:

- Run `pnpm build`, fix issues, then run `pnpm build` again until there are no more issues to fix.

## AGENTS maintenance

- Read local `AGENTS.md` in the folder you edit, when present.
- Keep AGENTS.md files aligned with actual architecture.
- Remove outdated or incorrect instructions.
- Documentation should be concise and minimal.
