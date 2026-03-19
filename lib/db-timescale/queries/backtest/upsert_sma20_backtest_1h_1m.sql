-- name: upsert_sma20_backtest_1h_1m
-- Rebuilds backtest_1h_1m for one ticker from candles_1h_1m.
-- The moving average samples the last 20 one-hour candles by holding the
-- minute-of-hour constant across rows.
INSERT INTO public.backtest_1h_1m (
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
    PARTITION BY source.ticker, EXTRACT(MINUTE FROM source.time)
    ORDER BY source.time
    ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
  ) AS close_sma_20
FROM public.candles_1h_1m AS source
WHERE source.ticker = $1
ORDER BY source.time
ON CONFLICT (ticker, time) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  close_sma_20 = EXCLUDED.close_sma_20;
