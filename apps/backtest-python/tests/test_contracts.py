from __future__ import annotations

import unittest

from backtest_python.sql_contracts import bind_numbered_query
from backtest_python.verify_contracts import validate_contracts


class ContractValidationTests(unittest.TestCase):
    def test_required_db_contracts_exist(self) -> None:
        self.assertEqual(validate_contracts(), [])

    def test_numbered_postgres_placeholders_bind_in_order(self) -> None:
        sql_text = "SELECT $2, $1, $2"
        converted_sql, bound_params = bind_numbered_query(sql_text, ("first", "second"))

        self.assertEqual(converted_sql, "SELECT %s, %s, %s")
        self.assertEqual(bound_params, ["second", "first", "second"])


if __name__ == "__main__":
    unittest.main()
