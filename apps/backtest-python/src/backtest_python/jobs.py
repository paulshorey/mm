from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class BacktestJob:
    key: str
    source_table: str
    target_table: str
    query_path: str
    required_source_columns: tuple[str, ...]
    required_target_columns: tuple[str, ...]
    sample_label: str


BACKTEST_JOBS = (
    BacktestJob(
        key="1m1s",
        source_table="candles_1m_1s",
        target_table="backtest_1m_1s",
        query_path="backtest/upsert_sma20_backtest_1m_1s.sql",
        required_source_columns=("time", "ticker", "symbol", "close"),
        required_target_columns=("time", "ticker", "symbol", "close_sma_20"),
        sample_label="same second-of-minute",
    ),
    BacktestJob(
        key="1h1m",
        source_table="candles_1h_1m",
        target_table="backtest_1h_1m",
        query_path="backtest/upsert_sma20_backtest_1h_1m.sql",
        required_source_columns=("time", "ticker", "symbol", "close"),
        required_target_columns=("time", "ticker", "symbol", "close_sma_20"),
        sample_label="same minute-of-hour",
    ),
)

JOB_BY_KEY = {job.key: job for job in BACKTEST_JOBS}
