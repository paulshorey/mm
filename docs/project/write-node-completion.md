# Finishing `write-node`

`write-node` is already in good shape. The shared rolling-window engine is
deterministic, live and historical paths share logic, CVD continuity carries
across restarts, and Timescale hypertables/compression are configured.

This document tracks the remaining work to make it the canonical, durable
source of truth across all in-scope tickers and timeframes.

## Status today

Already implemented and working:

- TBBO ingest (Databento live TCP + historical JSONL files).
- Front-month stitching across contract roll boundaries.
- Per-ticker market session calendar (Globex + Tokyo daytime starter set).
- Per-row metrics: OHLCV, CVD OHLC, VD, vd_ratio, book_imbalance, price_pct
  (basis points), divergence, trades, max_trade_size, big_trades, big_volume.
- Additive accumulators: sum_price_volume, sum_bid_depth, sum_ask_depth,
  unknown_volume.
- Two canonical tables: `candles_1m_1s`, `candles_1h_1m`.
- Tests covering aggregator behaviour and rolling-session continuity.

## Remaining work

### 1. Multi-ticker rollout (operational)

The code already supports any number of tickers. What's missing is config and
runbook.

Action items:

- Add `SI` and `HG` to `LARGE_TRADE_THRESHOLDS` in
  `apps/write-node/src/lib/trade/thresholds.ts`. Both are already in the
  per-ticker session profile map.
- Document the live env vars used in production:
  - `DATABENTO_DATASET=GLBX.MDP3`
  - `DATABENTO_STYPE=parent`
  - `DATABENTO_SYMBOLS=ES.FUT,NQ.FUT,GC.FUT,SI.FUT,HG.FUT,CL.FUT`
- Confirm Databento subscription includes those parent symbols.
- Add a write-node ops checklist (start, restart, verify, backfill).

### 2. Daily timeframe (`candles_1d_1h`)

Add a third canonical layer following the same pattern as `1h@1m`:

- New migration in `lib/db-timescale/migrations/` creating
  `public.candles_1d_1h` with the same column shape as `candles_1h_1m`, plus
  hypertable + compression policy. Window meaning: trailing 24 hours.
- New aggregator `src/stream/candles-1d-1h-aggregator.ts` that consumes
  hour-boundary rows of `candles_1h_1m` and writes daily rows.
- New historical script `scripts/candles-1d-1h.ts` that derives daily rows
  from existing `candles_1h_1m` content.
- Reuse `RollingCandleWindow` with `windowSize: 24, expectedIntervalMs: 3_600_000`.
- Live wiring: `candles-1h-1m-aggregator.ts` already forwards completed hourly
  rows; add a `candles-1d-1h-aggregator` consumer in the same flow.

Acceptance:

- Daily rows continuous across days for all in-scope tickers.
- Continuous CVD across the daily layer.
- Reproducible historical rebuild via `pnpm --filter write-node historical:1d1h --truncate`.

### 3. Optional: pure 1-second candles (`candles_1s_1s`)

The current `candles_1m_1s` table is **rolling 60-second candles** written
each second, not pure 1-second candles. The rolling-window engine internally
already constructs a `SecondSummary` per second.

If pure 1-second OHLCV is needed (for ML or short-horizon backtests), add:

- Migration creating `candles_1s_1s` with the same column shape, window=1s.
- Persist `SecondSummary` rows directly (no warmup, no rolling aggregation).

This is optional. Most multi-timeframe research can use `candles_1m_1s` as the
finest grain because it already exposes per-second cadence.

### 4. Operational visibility

Today the only HTTP route is `/api/v1/health`. Add a small read-only stats
endpoint so external monitors and humans can see liveness without a DB query:

- `GET /api/v1/stats` returns aggregator counters, ring-buffer state per
  ticker, last write timestamp per ticker, current CVD per ticker.

Source for the data already exists via `RollingWindow1m.getStats()` and
`getTickerSnapshots()`.

### 5. Backfill runbook

A documented playbook is missing. Recommended addition:

```
docs/operations/backfill.md  (or apps/write-node/docs/backfill.md)
```

Required content:

1. How to download Databento TBBO for a date range (CLI snippet, dataset,
   schema, symbols).
2. How to run `historical:tbbo` over those files (chunked, with progress).
3. How to run `historical:1h1m --truncate` (or incremental).
4. How to run `historical:1d1h` (after the daily layer ships).
5. How to verify continuity: row count per day per ticker, no gaps inside
   open-market windows, CVD monotonicity sanity checks.

### 6. Roadmap items intentionally NOT in write-node

Do not add these to `write-node`:

- RSI / MACD / Bollinger / multi-period indicators (downstream).
- Multi-period CVD slope / Z-score (downstream).
- ML feature tables (downstream).
- Any model training or inference (downstream).

These belong in `apps/backtest-python`. See `backtest-python.md`.

## Stretch nice-to-haves

- Per-ticker holiday overrides on top of the weekly session calendar.
- Configurable per-ticker large-trade thresholds via env (currently hardcoded).
- Persisted aggregator stats snapshot table for easier ops queries.
- Replay tooling that re-runs a date range and diffs against the existing
  table to verify determinism after engine changes.
