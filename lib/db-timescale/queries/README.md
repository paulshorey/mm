# Query Contracts

Store reusable SQL contracts here for candle and backtest workloads.

Keep contract SQL language-agnostic so TypeScript, Python, C#, and R clients
can generate or implement bindings from the same definitions.

## Current contracts

- `candles/upsert_candles.sql`
- `candles/select_recent_candles.sql`
- `backtest/upsert_sma20_backtest_1m_1s.sql`
- `backtest/upsert_sma20_backtest_1h_1m.sql`
