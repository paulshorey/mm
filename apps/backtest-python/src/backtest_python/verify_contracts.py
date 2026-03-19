from __future__ import annotations

from .contracts import column_names, load_schema_contract
from .jobs import BACKTEST_JOBS
from .sql_contracts import bind_numbered_query, load_query


def validate_contracts() -> list[str]:
    schema_contract = load_schema_contract()
    errors: list[str] = []

    for job in BACKTEST_JOBS:
        if job.source_table not in schema_contract:
            errors.append(f"Missing source table in db-schema.json: {job.source_table}")
            continue
        if job.target_table not in schema_contract:
            errors.append(f"Missing target table in db-schema.json: {job.target_table}")
            continue

        source_columns = column_names(schema_contract, job.source_table)
        target_columns = column_names(schema_contract, job.target_table)

        missing_source_columns = sorted(set(job.required_source_columns) - source_columns)
        if missing_source_columns:
            errors.append(
                f"{job.source_table} is missing required columns: {', '.join(missing_source_columns)}"
            )

        missing_target_columns = sorted(set(job.required_target_columns) - target_columns)
        if missing_target_columns:
            errors.append(
                f"{job.target_table} is missing required columns: {', '.join(missing_target_columns)}"
            )

        query_text = load_query(job.query_path)
        if job.source_table not in query_text:
            errors.append(f"{job.query_path} does not reference source table {job.source_table}")
        if job.target_table not in query_text:
            errors.append(f"{job.query_path} does not reference target table {job.target_table}")

        bind_numbered_query(query_text, ("ES",))

    return errors


def main() -> int:
    errors = validate_contracts()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("backtest-python contract verification passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
