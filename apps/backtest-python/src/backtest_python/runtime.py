from __future__ import annotations

import argparse
import os

from .jobs import BACKTEST_JOBS, JOB_BY_KEY, BacktestJob
from .sql_contracts import bind_numbered_query, load_query
from .verify_contracts import validate_contracts


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run simple backtest jobs for one ticker")
    parser.add_argument("--ticker", required=True, help="Futures instrument ticker, for example ES")
    parser.add_argument(
        "--job",
        choices=("all", *JOB_BY_KEY.keys()),
        default="all",
        help="Run one backtest table or all tables",
    )
    parser.add_argument("--truncate", action="store_true", help="Delete existing rows for the ticker first")
    parser.add_argument("--dsn", help="Override TIMESCALE_DB_URL for this run")
    return parser.parse_args(argv)


def _import_psycopg():
    try:
        import psycopg
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "psycopg is required at runtime. From apps/backtest-python run "
            "`python3 -m pip install -e .`"
        ) from exc

    return psycopg


def _resolve_dsn(cli_dsn: str | None) -> str:
    dsn = cli_dsn or os.environ.get("TIMESCALE_DB_URL")
    if not dsn:
        raise RuntimeError("TIMESCALE_DB_URL is required unless --dsn is provided")
    return dsn


def _selected_jobs(job_key: str) -> tuple[BacktestJob, ...]:
    if job_key == "all":
        return BACKTEST_JOBS
    return (JOB_BY_KEY[job_key],)


def run_backtest(ticker: str, dsn: str, job_key: str = "all", truncate: bool = False) -> None:
    contract_errors = validate_contracts()
    if contract_errors:
        raise RuntimeError("Contract validation failed:\n- " + "\n- ".join(contract_errors))

    psycopg = _import_psycopg()

    with psycopg.connect(dsn) as connection:
        with connection.cursor() as cursor:
            for job in _selected_jobs(job_key):
                if truncate:
                    cursor.execute(
                        f"DELETE FROM public.{job.target_table} WHERE ticker = %s",
                        (ticker,),
                    )

                query_text = load_query(job.query_path)
                executable_sql, executable_params = bind_numbered_query(query_text, (ticker,))
                cursor.execute(executable_sql, executable_params)

                print(
                    f"Updated {job.target_table} for {ticker} "
                    f"using the {job.sample_label} sampling rule"
                )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    run_backtest(
        ticker=args.ticker,
        dsn=_resolve_dsn(args.dsn),
        job_key=args.job,
        truncate=args.truncate,
    )
    return 0
