# backtest-python

Python research app for downstream feature engineering, ML training, and
backtesting on top of canonical candle tables produced by
[`apps/write-node`](../write-node/README.md).

This app is a stub. See `docs/project/backtest-python.md` at the repo root for
the full implementation plan.

## What this app does (planned)

- Reads canonical candles from TimescaleDB:
  - `candles_1m_1s` — rolling 60-second window written every second
  - `candles_1h_1m` — rolling 60-minute window written every minute
  - `candles_1d_1h` — rolling 24-hour window written every hour (planned)
- Builds derived features (multi-timeframe RSI, CVD slope, returns, vol).
- Persists features into a long-format `features_v1` table.
- Runs walk-forward backtests with realistic slippage and commission.
- Trains ML models (LightGBM/XGBoost first; sequence models later).
- Writes model registry, backtest results, and predictions into TimescaleDB.

## Quick start

```bash
# From the repo root
cd apps/backtest-python

# Recommended: uv
# https://docs.astral.sh/uv/
uv venv
uv sync                       # installs from pyproject.toml

# Or with pip
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Connect to the same TimescaleDB used by write-node
export TIMESCALE_DB_URL="postgres://..."
```

Once the CLI is implemented:

```bash
uv run python -m backtest.cli read-candles --ticker ES --timeframe 1m_1s --limit 50
```

## Database

This app reads canonical tables owned by `@lib/db-timescale` and writes its
own derived tables (`features_v1`, `models`, `backtests`, `predictions`). All
schema changes go through that package's migrations. See
`docs/project/backtest-python.md` for the proposed schema.

## Project goals and architecture

- `docs/project/roadmap.md` — phased roadmap across all apps
- `docs/project/backtest-python.md` — architecture, schema, and step-by-step
  implementation plan for this app
- `AGENTS.md` — concise rules for engineers and AI agents working in this app

## Status

| Area                        | Status     |
| --------------------------- | ---------- |
| Project skeleton            | scaffolded |
| DB connection + readers     | TODO       |
| `features_v1` migration     | TODO       |
| Multi-timeframe RSI feature | TODO       |
| Walk-forward backtest engine| TODO       |
| LightGBM baseline model     | TODO       |
| Live inference loop         | TODO       |
