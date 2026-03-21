# Generated Language Artifacts

Derived outputs from Timescale migration/schema/query contracts.

Suggested targets:

- `typescript/`
- `python/`
- `csharp/`
- `r/`

## Current generated outputs

- `typescript/db-types.ts` - generated row interfaces and table map
- `contracts/db-schema.json` - machine-readable schema contract currently consumed by the Python backtesting app and other language tooling

## Regenerate

- `pnpm --filter @lib/db-timescale db:types:generate`
