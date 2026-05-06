"""Typer-based CLI entry point.

Run with::

    uv run python -m backtest.cli read-candles --ticker ES --timeframe 1m_1s --limit 5
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

import typer

from .config import CANONICAL_TIMEFRAMES, SUPPORTED_TICKER_SET, Timeframe
from .db.candles import read_candles

app = typer.Typer(help="Downstream feature, model, and backtest CLI.")


def _parse_dt(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value)


@app.command("read-candles")
def read_candles_cmd(
    ticker: str = typer.Option(..., help="Ticker symbol, e.g. ES"),
    timeframe: str = typer.Option("1m_1s", help=f"One of {CANONICAL_TIMEFRAMES}"),
    start: Optional[str] = typer.Option(None, help="ISO timestamp lower bound (inclusive)"),
    end: Optional[str] = typer.Option(None, help="ISO timestamp upper bound (exclusive)"),
    limit: Optional[int] = typer.Option(None, help="Optional row limit"),
) -> None:
    """Read canonical candles and print a small preview."""
    if ticker not in SUPPORTED_TICKER_SET:
        typer.echo(f"warning: ticker {ticker!r} is not in the configured ticker set", err=True)
    if timeframe not in CANONICAL_TIMEFRAMES:
        raise typer.BadParameter(f"timeframe must be one of {CANONICAL_TIMEFRAMES}")

    df = read_candles(
        ticker=ticker,
        timeframe=timeframe,  # type: ignore[arg-type]
        start=_parse_dt(start),
        end=_parse_dt(end),
        limit=limit,
    )
    typer.echo(f"loaded {len(df)} row(s) for {ticker} {timeframe}")
    if not df.empty:
        typer.echo(df.head(10).to_string())


@app.command("build-features")
def build_features_cmd() -> None:
    """Placeholder for feature builder. See docs/project/backtest-python.md."""
    typer.echo("build-features not yet implemented; see docs/project/backtest-python.md")


@app.command("train")
def train_cmd() -> None:
    """Placeholder for model training. See docs/project/backtest-python.md."""
    typer.echo("train not yet implemented; see docs/project/backtest-python.md")


@app.command("backtest")
def backtest_cmd() -> None:
    """Placeholder for backtest runner. See docs/project/backtest-python.md."""
    typer.echo("backtest not yet implemented; see docs/project/backtest-python.md")


def main() -> None:
    app()


if __name__ == "__main__":
    main()
