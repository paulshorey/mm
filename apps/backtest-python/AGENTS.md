# backtest-python

Downstream Python backtesting and indicator app.

## Boundaries

- Read canonical candle tables from `@lib/db-timescale`.
- Write only derived backtest tables owned by `@lib/db-timescale`.
- Keep schema expectations aligned with
  `lib/db-timescale/generated/contracts/db-schema.json`.

## Current scope

- Read `candles_1m_1s` and `candles_1h_1m`.
- Compute a 20-period moving average of `close`.
- Write results to `backtest_1m_1s` and `backtest_1h_1m`.

## Sampling rules

- `backtest_1m_1s` must sample the last 20 candles by matching
  second-of-minute.
- `backtest_1h_1m` must sample the last 20 candles by matching minute-of-hour.
- Do not treat the last 20 rows as the last 20 candles.

## Tooling

- Keep `package.json` scripts Turbo-friendly.
- Keep build/test commands working with Python stdlib only.
- Runtime DB access uses `TIMESCALE_DB_URL` and `psycopg`.
