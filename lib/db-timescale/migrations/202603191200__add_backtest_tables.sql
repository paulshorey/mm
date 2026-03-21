CREATE TABLE IF NOT EXISTS public.backtest_1m_1s (
    "time" timestamp with time zone NOT NULL,
    ticker text NOT NULL,
    symbol text,
    close_sma_20 double precision NOT NULL,
    CONSTRAINT backtest_1m_1s_pkey PRIMARY KEY (ticker, "time")
);

CREATE INDEX IF NOT EXISTS idx_backtest_1m_1s_time_desc
    ON public.backtest_1m_1s USING btree ("time" DESC);

SELECT create_hypertable(
    'public.backtest_1m_1s',
    by_range('time', INTERVAL '1 week'),
    if_not_exists => TRUE,
    create_default_indexes => FALSE
);

ALTER TABLE public.backtest_1m_1s SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'ticker',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy(
    'public.backtest_1m_1s',
    compress_after => INTERVAL '1 week',
    if_not_exists => TRUE
);

CREATE TABLE IF NOT EXISTS public.backtest_1h_1m (
    "time" timestamp with time zone NOT NULL,
    ticker text NOT NULL,
    symbol text,
    close_sma_20 double precision NOT NULL,
    CONSTRAINT backtest_1h_1m_pkey PRIMARY KEY (ticker, "time")
);

CREATE INDEX IF NOT EXISTS idx_backtest_1h_1m_time_desc
    ON public.backtest_1h_1m USING btree ("time" DESC);

SELECT create_hypertable(
    'public.backtest_1h_1m',
    by_range('time', INTERVAL '1 month'),
    if_not_exists => TRUE,
    create_default_indexes => FALSE
);

ALTER TABLE public.backtest_1h_1m SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'ticker',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy(
    'public.backtest_1h_1m',
    compress_after => INTERVAL '1 month',
    if_not_exists => TRUE
);
