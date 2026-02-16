This project is a monorepo of multiple NextJS apps. It uses Vercel's TurboRepo to build, test, and deploy.

### Folder structure

**Apps:**

- market-view-ts - ./apps/market-view-ts - TypeScript app to display financial charts and data analysis visualizations
- market-view-next - ./apps/market-view-next - Next.js UI for charting and data visualization
- market-write-ts - ./apps/market-write-ts - TypeScript server that connects to data providers, ingests price and volume data per trade, calculates indicators, aggregates candles and higher timeframes for backtestsing
- market-write-node - ./apps/market-write-node - Node.js/Express market data ingestion service
- tradingview-node - ./apps/tradingview-node - Node.js/Express API for TradingView webhook ingest and strength reads
- log - ./apps/log - logging and observability dashboard
- trade ./apps/trade - trades, orders, and position management

**Shared Libraries:**

- common - ./lib/common - shared utilities imported by all apps
  - ./lib/common/sql - database functions to get/add/edit each data type
  - ./lib/common/twillio - Twilio integration for SMS alerts
  - ./lib/common/fe - client-side React components, hooks, and utility functions
  - ./lib/common/cc - cloud console logging
  - ./lib/common/lib/db/neon.ts - Neon/PostgreSQL database connection
  - ./lib/common/lib/nextjs - Next.js utility functions

- ./lib/config - build configuration and tooling (eslint, typescript, tailwind, postcss)

**Targeting a specific app:**

1. `cd` into the app directory, then run the command: `cd apps/trade && pnpm test`
2. Use the `--filter` flag: `pnpm --filter trade build`

### NPM

Always use `pnpm` instead of `npm`.

### Import paths

**Within apps (`./apps/*`):**

- Use `@/path/to/file` for imports within the same app
- Use `@lib/common/...` to import from `../../lib/common/...`
- Examples: `import { cc } from '@lib/common/cc'` or `import { getDb } from '@lib/common/lib/db/neon'`

**Within `@lib` (shared library):**

- Use relative paths like `../../` (not the `@lib/common` alias)

**Warning:** Don't "fix" or "optimize" import paths. They are intentionally specific. Similar folder names exist at different levels (`@/lib`, `@/dydx/lib`, `@lib/common/lib`, `@lib/common/fe/lib`). Only update an import path if you've moved the file it references.

### Checks

Check both `lint` and `build` at the same time using `npm run build`.

### Questions

If I present you with a contradictory or confusing request, ask to clarify.

### Web search

Do not guess. When the answer is not obvious, research before writing code. Use the appropriate rule:

- **Technical questions** (API docs, error fixes, code patterns, config, library usage) --> use `.cursor/rules/deep-search.mdc`. Search hard with Cursor's built-in web tools. Run multiple queries, read full pages, verify information is current.

- **Broad/exploratory questions** (unclear approach, trade-offs between fundamentally different strategies, need community perspective, unfamiliar territory) --> use `.cursor/rules/perplexity-research.mdc`. Use Perplexity to explore the landscape, find real-world experiences, and discover unknowns.

- **Complex questions** that need both --> start with Perplexity to orient and understand the landscape, then use deep-search for implementation specifics.

## Workflow

If something definitely needs improvement, don't bother asking - just change it.

## Start of work

Install dependencies

```
pnpm install
```

On first session only, fetch environment variables from Infisical

```
pnpm run init
```

## End of work

After you "think" you've finished the task, run `npm run build` to check for errors. Fix any errors. Then run `npm run build` again! to make sure nothing else is broken. Continue running `npm run build` and fixing errors until no more problems. If there are many errors, rethink the approach. Maybe the code can be written in a better way?

### Documentation

**When working in any folder:**

Read the AGENTS.md file in that folder (if exists) before making changes.

**After finishing work:**

Update the AGENTS.md file to document any significant architectural decisions or non-obvious patterns
Keep documentation concise - only document complex concepts that aren't obvious from reading the code
Remove outdated or incorrect info; consolidate redundant content
