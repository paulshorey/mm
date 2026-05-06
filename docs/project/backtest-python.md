# `apps/backtest-python` plan

A Python research app inside the monorepo that reads canonical TimescaleDB
candle tables, builds derived features (multi-timeframe RSI, CVD slope, etc.),
trains and evaluates ML models, and runs backtests.

## Why Python here

- Tabular ML tooling (scikit-learn, LightGBM, XGBoost, statsmodels) is best in
  Python.
- pandas/polars + numpy are the standard for timeseries feature engineering.
- Jupyter notebooks are the natural environment for research workflows.
- TypeScript apps in this repo continue to own runtime ingest and UI; they do
  not need to do heavy numerical work.

## Boundary contract

`backtest-python` only **reads** from canonical tables produced by
`write-node`:

- `candles_1m_1s`
- `candles_1h_1m`
- (planned) `candles_1d_1h`

`backtest-python` **writes** its own tables, never the canonical ones:

- `features_v1` — derived feature timeseries
- `models` — model registry (params, metrics, artifact location)
- `backtests` — backtest run summaries
- `predictions` — model predictions per `(ticker, time)` for live inference

Schema for these tables lives in `@lib/db-timescale/migrations/` so it stays
under the same database-first contract as the canonical tables.

## Suggested layout

```
apps/backtest-python/
  AGENTS.md
  README.md
  pyproject.toml
  .python-version
  .gitignore
  src/backtest/
    __init__.py
    config.py              # tickers, timeframes, registries
    db/
      __init__.py
      connection.py        # asyncpg / psycopg pool
      candles.py           # readers for canonical tables
      features.py          # writers for features_v1
      models.py            # readers/writers for models registry
      backtests.py         # readers/writers for backtests
      predictions.py       # readers/writers for predictions
    features/
      __init__.py
      registry.py
      rsi.py               # multi-timeframe RSI
      cvd.py               # CVD-derived features
      returns.py           # rolling/forward returns, vol
      multitimeframe.py    # alignment helpers across 1m/1h/1d
    backtest/
      __init__.py
      engine.py            # walk-forward loop
      strategy.py          # Strategy interface
      portfolio.py         # position sizing, fills, slippage
      metrics.py           # Sharpe, Sortino, max DD, etc.
    models/
      __init__.py
      base.py              # train/predict interface
      gbm.py               # LightGBM/XGBoost wrappers
      labels.py            # forward-return labels
      eval.py              # OOS evaluation utilities
    cli.py                 # typer-based command entry points
  notebooks/
    01_explore_canonical.ipynb
    02_features_rsi.ipynb
    03_baseline_strategy.ipynb
    04_train_gbm.ipynb
  tests/
    test_features_rsi.py
    test_engine.py
```

## Tooling

- Python 3.11+
- `uv` for dependency and venv management (fast, reproducible). `pip` works
  but `uv` is preferred.
- `ruff` for lint/format. `pytest` for tests.
- DB driver: `psycopg[binary,pool]` (sync, simpler) or `asyncpg` (async).
  Recommend `psycopg` for research since notebooks are sync-heavy.
- Numerical: `pandas`, `polars`, `numpy`.
- ML: `scikit-learn`, `lightgbm`, `xgboost`. Optional later: `pytorch`.
- Plotting: `matplotlib`. Notebook: `jupyterlab`.

## Database additions

Add three new migrations in `@lib/db-timescale/migrations/`. Schema sketch
only — refine before applying.

### `features_v1`

Long-format feature table keyed by ticker, time, timeframe, feature name. Long
format keeps the writer simple and lets new features be added without
migrations.

```sql
CREATE TABLE IF NOT EXISTS public.features_v1 (
  "time"     TIMESTAMPTZ  NOT NULL,
  ticker     TEXT         NOT NULL,
  timeframe  TEXT         NOT NULL,        -- '1m_1s' | '1h_1m' | '1d_1h'
  feature    TEXT         NOT NULL,        -- e.g. 'rsi_14'
  value      DOUBLE PRECISION,
  CONSTRAINT features_v1_pkey
    PRIMARY KEY (ticker, timeframe, feature, "time")
);

SELECT create_hypertable(
  'public.features_v1',
  by_range('time', INTERVAL '1 month'),
  if_not_exists => TRUE,
  create_default_indexes => FALSE
);

ALTER TABLE public.features_v1 SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'ticker, timeframe, feature',
  timescaledb.compress_orderby = 'time DESC'
);
```

### `models`

```sql
CREATE TABLE IF NOT EXISTS public.models (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  version       TEXT NOT NULL,
  params        JSONB NOT NULL,
  metrics       JSONB NOT NULL,
  artifact_uri  TEXT,                      -- e.g. file://, s3://
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);
```

### `backtests`

```sql
CREATE TABLE IF NOT EXISTS public.backtests (
  id            BIGSERIAL PRIMARY KEY,
  model_id      BIGINT REFERENCES public.models(id),
  strategy      TEXT NOT NULL,
  ticker        TEXT NOT NULL,
  range_start   TIMESTAMPTZ NOT NULL,
  range_end     TIMESTAMPTZ NOT NULL,
  params        JSONB NOT NULL,
  metrics       JSONB NOT NULL,            -- Sharpe, Sortino, max_dd, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `predictions`

```sql
CREATE TABLE IF NOT EXISTS public.predictions (
  "time"      TIMESTAMPTZ NOT NULL,
  ticker      TEXT NOT NULL,
  model_id    BIGINT NOT NULL REFERENCES public.models(id),
  prediction  DOUBLE PRECISION NOT NULL,
  label       DOUBLE PRECISION,            -- nullable until forward window closes
  CONSTRAINT predictions_pkey PRIMARY KEY (model_id, ticker, "time")
);

SELECT create_hypertable(
  'public.predictions',
  by_range('time', INTERVAL '1 month'),
  if_not_exists => TRUE,
  create_default_indexes => FALSE
);
```

## Step-by-step implementation plan

### Step 1 — Bootstrap the app

- Create `apps/backtest-python/` skeleton: `pyproject.toml`, `AGENTS.md`,
  `README.md`, `src/backtest/`, `notebooks/`, `tests/`.
- Add to `pnpm-workspace.yaml`? No — this is a Python package. The monorepo
  Turbo build does not need to know about it. `pnpm build` already filters by
  workspace and will skip it.
- Pin Python with `.python-version` and `uv.lock` (or `requirements.txt`).
- Expose a single `cli.py` entry point with subcommands: `read-candles`,
  `build-features`, `train`, `backtest`.

### Step 2 — Read canonical candles

- Implement `db/connection.py` reading `TIMESCALE_DB_URL` with `psycopg`.
- Implement `db/candles.py`:
  - `read_candles_1m_1s(ticker, start, end) -> pandas.DataFrame`
  - same for `1h_1m`, `1d_1h`.
- Notebook `01_explore_canonical.ipynb` plots a few days for ES and confirms
  the data looks sane (continuity, CVD curves, volume, no NaNs in required
  columns).

Validation gates before moving on:

- No timestamp gaps inside open-market windows.
- CVD is monotonic only as expected (changes by per-second VD, not jumps).
- Row count per day matches expected open-market seconds.

### Step 3 — Multi-timeframe RSI as the first feature

- Implement `features/rsi.py`:
  - Standard Wilder RSI on `close`.
  - Vectorized over a pandas Series.
  - Configurable period.
- Implement a writer in `db/features.py` that batches inserts into
  `features_v1` with `(ticker, timeframe, feature, time)` as primary key.
- CLI command:
  ```
  python -m backtest.cli build-features rsi \
    --ticker ES \
    --timeframe 1m_1s \
    --period 14 \
    --start 2026-01-01 --end 2026-02-01
  ```
- Notebook `02_features_rsi.ipynb`: load price + RSI(14) on 1m and 1h and
  confirm overbought/oversold zones look right.
- Compute RSI on **each canonical timeframe separately** (1m_1s, 1h_1m,
  1d_1h). Multi-timeframe RSI is just the union of these features at the
  feature-vector level.

### Step 4 — Strategy interface and a baseline backtest

- `backtest/strategy.py` defines:
  ```python
  class Strategy(Protocol):
      def signals(self, df: pd.DataFrame) -> pd.Series: ...   # -1/0/+1
  ```
- `backtest/engine.py` runs walk-forward with explicit slippage and commission.
- `backtest/metrics.py` returns Sharpe, Sortino, max DD, hit rate, expectancy,
  exposure.
- Implement a baseline rules-based strategy:
  - Long when RSI(14) on 1h crosses up through 30 **and** CVD slope on 1h is
    rising.
  - Flat otherwise.
- Run on ES across 6 months. Persist result to `backtests`.

### Step 5 — Tabular ML baseline (LightGBM)

- `models/labels.py`: forward N-bar return, sign label, vol-adjusted label.
- Build a feature vector per `(ticker, time)` joining:
  - Price returns at multiple lookbacks.
  - RSI at multiple periods on multiple timeframes.
  - CVD-derived features (slope, Z-score) on multiple timeframes.
  - Book imbalance, divergence, vd_ratio.
- Train LightGBM with **time-based split**: train < t1 < val < t2 < test.
- Evaluate on the held-out test range against:
  - Random baseline.
  - Always-flat baseline.
  - The Step 4 rules-based strategy.
- Persist model to `models`. Persist `predictions` for the test range.
- Run backtest on `predictions` and persist to `backtests`.

### Step 6 — Live inference loop (later)

- Schedule a job (cron or similar) that, every minute or every hour:
  - Reads latest canonical candles.
  - Recomputes the same features for the latest row.
  - Runs the deployed model.
  - Writes a row into `predictions`.
- A simple dashboard in `view-next` reads `predictions` and shows current
  ticker-by-ticker signals with confidence.

## Anti-pitfalls (must read before writing features)

- **No look-ahead leakage.** A feature row at time T may only depend on data
  with `time <= T`. Forward returns are labels, not features.
- **No random shuffling.** All splits must be time-based. K-fold cross
  validation is wrong for timeseries; use expanding-window or rolling-window
  CV.
- **Survivorship bias.** Front-month stitching avoids contract-roll bias, but
  any future filter on universe membership must respect data available at the
  time.
- **Slippage and fees matter.** A backtest without realistic costs is
  decoration. Pick conservative defaults.
- **Reproducibility.** Every backtest and training run records the data range,
  feature versions, hyperparameters, and metrics. No "I think this run was
  better."
- **Compute discipline.** Long backtests should stream from the DB with
  `(ticker, time)` paging, not load everything into memory.

## Open questions to resolve before Step 5

- Trade frequency target: are we targeting 1 trade/day, 1 trade/hour, or pure
  ML scoring with no trade rule? This determines label horizon.
- Capital and leverage assumptions for backtests.
- Slippage model: fixed ticks per fill, or quote-derived from book imbalance.
- Whether to model partial fills or assume full fills at next-bar open.

These can be parameterized; pick defaults early to avoid over-fitting research
to a specific assumption.
