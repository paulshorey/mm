from __future__ import annotations

import re
from collections.abc import Sequence

from .contracts import QUERIES_DIR

PLACEHOLDER_PATTERN = re.compile(r"\$(\d+)")


def load_query(relative_path: str) -> str:
    query_path = QUERIES_DIR / relative_path
    return query_path.read_text(encoding="utf-8")


def bind_numbered_query(sql_text: str, params: Sequence[object]) -> tuple[str, list[object]]:
    positions = [int(match.group(1)) for match in PLACEHOLDER_PATTERN.finditer(sql_text)]
    converted_sql = PLACEHOLDER_PATTERN.sub("%s", sql_text)

    bound_params: list[object] = []
    for position in positions:
        if position < 1 or position > len(params):
            raise ValueError(f"SQL placeholder ${position} is out of range for {len(params)} params")
        bound_params.append(params[position - 1])

    return converted_sql, bound_params
