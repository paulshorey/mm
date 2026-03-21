from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in (current, *current.parents):
        if (candidate / "pnpm-workspace.yaml").exists():
            return candidate
    raise RuntimeError("Unable to locate repo root from backtest_python package")


REPO_ROOT = _find_repo_root()
DB_TIMESCALE_DIR = REPO_ROOT / "lib" / "db-timescale"
SCHEMA_CONTRACT_PATH = DB_TIMESCALE_DIR / "generated" / "contracts" / "db-schema.json"
QUERIES_DIR = DB_TIMESCALE_DIR / "queries"


def load_schema_contract() -> dict[str, list[dict[str, Any]]]:
    payload = json.loads(SCHEMA_CONTRACT_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("db-schema.json must contain a JSON object at the top level")
    return payload


def column_names(schema_contract: dict[str, list[dict[str, Any]]], table_name: str) -> set[str]:
    columns = schema_contract.get(table_name, [])
    return {str(column["column"]) for column in columns}
