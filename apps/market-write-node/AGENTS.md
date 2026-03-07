# market-write-node

Streamlined futures data-write pipeline.

## Current scope

This app ingests TBBO trade data and writes **rolling 1-minute candles at
1-second resolution** to `candles_1m_1s`.

Each stored row is the trailing 60-second window for a ticker at that second:

- input resolution: individual TBBO trades
- output timeframe: 1 minute
- output write cadence: 1 second

The app has two ingest modes:

- `src/stream/tbbo-stream.ts` for live Databento TCP data
- `scripts/tbbo-1m-1s.ts` for historical JSONL backfills

Both paths must stay aligned and should share aggregation logic whenever
possible.

## Near-term roadmap

Do not redesign the app around traditional closed-bar timeframes.

The intended model is:

- `1m` candles written at `1s` resolution
- later: `1h` candles written at `1m` resolution
- later: `1d` candles written at `30m` resolution

The saved resolution is therefore finer than the candle timeframe, because each
row represents a rolling window that is recalculated on a higher-frequency
schedule.

## Runtime architecture

```
src/index.ts
  -> src/stream/tbbo-stream.ts
  -> src/stream/tbbo-1m-aggregator.ts
  -> src/lib/trade/*
  -> TimescaleDB candles_1m_1s
```

Key rules:

- keep the runtime focused on writing data, not serving an API
- only `/health` exists; there is no `src/api/`
- use `TIMESCALE_URL` through `@lib/db-timescale`
- keep front-month stitching and rolling-window aggregation deterministic
- prefer shared library code over duplicated live/batch logic

## Source layout

```
src/
  index.ts
  lib/
    db.ts
    metrics/
    trade/
  stream/
    tbbo-stream.ts
    tbbo-1m-aggregator.ts
scripts/
  tbbo-1m-1s.ts
docs/
  index.md
```

## Documentation

Only keep docs that match the current writer pipeline and near-term roadmap.
Remove or rewrite anything that still references:

- old `ohlcv_*` schemas
- `minute_index` / `second_index` query models
- nonexistent API layers
- unrelated backtesting experiments inside this app
