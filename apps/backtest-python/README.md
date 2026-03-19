# backtest-python

Starter Python backtesting app for Timescale candle data.

## Purpose

This app is the first Python consumer of `@lib/db-timescale`.

It does not own schema directly. Instead it relies on:

- `lib/db-timescale/generated/contracts/db-schema.json` for build-time schema checks
- `lib/db-timescale/queries/backtest/*.sql` for shared SQL contracts
- `TIMESCALE_DB_URL` for runtime database access

If required tables or columns disappear from the shared DB contract, this app's
build should fail.

## Current job

For a given ticker such as `ES`, the app:

1. reads `candles_1m_1s`
2. reads `candles_1h_1m`
3. computes a 20-period moving average of `close`
4. writes the results to `backtest_1m_1s` and `backtest_1h_1m`

The sampling model follows the writer app's rolling-candle design:

- `backtest_1m_1s` uses the last 20 rows with the same second-of-minute
- `backtest_1h_1m` uses the last 20 rows with the same minute-of-hour

## Install runtime dependency

The repo does not yet have a shared Python dependency bootstrap. Install the
runtime dependency inside your preferred Python environment:

```bash
cd apps/backtest-python
python3 -m pip install -e .
```

## Run

```bash
export TIMESCALE_DB_URL="postgres://..."
pnpm --filter backtest-python start -- --ticker ES
```

Optional flags:

- `--job 1m1s`
- `--job 1h1m`
- `--truncate`
- `--dsn postgres://...`

## Validate

```bash
pnpm --filter backtest-python build
pnpm --filter backtest-python test
```
