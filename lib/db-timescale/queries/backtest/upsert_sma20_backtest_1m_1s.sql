-- name: upsert_sma20_backtest_1m_1s
-- Rebuilds backtest_1m_1s for one ticker from candles_1m_1s.
-- The moving average samples the last 20 one-minute candles by holding the
-- second-of-minute constant across rows.
INSERT INTO public.backtest_1m_1s (
  time,
  ticker,
  symbol,
  close_sma_20
)
SELECT
  source.time,
  source.ticker,
  source.symbol,
  AVG(source.close) OVER (
    PARTITION BY source.ticker, EXTRACT(SECOND FROM source.time)
    ORDER BY source.time
    ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
  ) AS close_sma_20
FROM public.candles_1m_1s AS source
WHERE source.ticker = $1
ORDER BY source.time
ON CONFLICT (ticker, time) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  close_sma_20 = EXCLUDED.close_sma_20;
