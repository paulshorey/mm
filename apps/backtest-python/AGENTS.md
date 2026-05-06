# `backtest-python`

Python research app inside the monorepo. Reads canonical TimescaleDB candle
tables produced by `apps/write-node` and writes derived feature, model, and
backtest tables.

## Boundary contract

Reads (canonical, owned by `write-node`):

- `candles_1m_1s`
- `candles_1h_1m`
- `candles_1d_1h` (planned)

Writes (downstream, owned by this app):

- `features_v1` — long-format feature timeseries keyed by `(ticker, timeframe, feature, time)`
- `models` — model registry
- `backtests` — backtest run summaries
- `predictions` — model predictions per `(ticker, time)`

Schema for these tables lives in `@lib/db-timescale/migrations/`. Do not
create or alter tables outside that package.

## Source layout

```
src/backtest/
  config.py              # tickers, timeframes, registries
  db/                    # connection + readers/writers
  features/              # feature definitions (RSI, CVD, returns, ...)
  backtest/              # walk-forward engine, strategy, metrics
  models/                # ML training/eval wrappers
  cli.py                 # entry point: build-features, train, backtest
notebooks/               # research notebooks
tests/                   # pytest suite
```

## Operational rules

- Use `uv` (preferred) or `pip` with a pinned `requirements.txt` for env
  management. Do not invent ad hoc venvs.
- Python 3.11+.
- Never write to canonical tables. Only read from them.
- All DB writes go through `db/` modules so types and schemas stay consistent.
- All ML splits must be **time-based**. No random shuffling on timeseries.
- Features must use only data available at the row's `time` (no look-ahead).
- Every backtest and training run must record inputs (data range, params,
  feature versions) into the `backtests` / `models` tables.
- Register new features in `features/registry.py` so they have stable names
  in `features_v1.feature`.

## Useful entry points

```bash
# Once implemented:
uv run python -m backtest.cli read-candles --ticker ES --timeframe 1m_1s --limit 100
uv run python -m backtest.cli build-features rsi --ticker ES --timeframe 1m_1s --period 14 --start 2026-01-01 --end 2026-02-01
uv run python -m backtest.cli train --model gbm --range 2026-01-01:2026-04-01
uv run python -m backtest.cli backtest --strategy rsi_cvd --ticker ES --range 2026-01-01:2026-04-01
```

## Related docs

- `docs/project/roadmap.md` — phased plan across all apps
- `docs/project/backtest-python.md` — full plan and architecture for this app
- `apps/write-node/AGENTS.md` — canonical writer contract
