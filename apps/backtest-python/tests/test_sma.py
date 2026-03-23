from __future__ import annotations

import unittest
from datetime import datetime, timezone

from backtest_python.sma import PricePoint, grouped_simple_moving_average


class GroupedSimpleMovingAverageTests(unittest.TestCase):
    def test_same_second_groups_are_independent(self) -> None:
        points = [
            PricePoint(datetime(2026, 3, 19, 10, 0, 5, tzinfo=timezone.utc), 10.0),
            PricePoint(datetime(2026, 3, 19, 10, 0, 10, tzinfo=timezone.utc), 100.0),
            PricePoint(datetime(2026, 3, 19, 10, 1, 5, tzinfo=timezone.utc), 20.0),
            PricePoint(datetime(2026, 3, 19, 10, 1, 10, tzinfo=timezone.utc), 200.0),
            PricePoint(datetime(2026, 3, 19, 10, 2, 5, tzinfo=timezone.utc), 30.0),
        ]

        outputs = grouped_simple_moving_average(points, slot_getter=lambda timestamp: timestamp.second)

        self.assertEqual([round(point.value, 6) for point in outputs], [10.0, 100.0, 15.0, 150.0, 20.0])

    def test_same_minute_window_trims_to_last_n_samples(self) -> None:
        points = [
            PricePoint(datetime(2026, 3, 19, 9, 7, 0, tzinfo=timezone.utc), 10.0),
            PricePoint(datetime(2026, 3, 19, 10, 7, 0, tzinfo=timezone.utc), 20.0),
            PricePoint(datetime(2026, 3, 19, 11, 7, 0, tzinfo=timezone.utc), 30.0),
        ]

        outputs = grouped_simple_moving_average(
            points,
            slot_getter=lambda timestamp: timestamp.minute,
            window_size=2,
        )

        self.assertEqual([round(point.value, 6) for point in outputs], [10.0, 15.0, 25.0])


if __name__ == "__main__":
    unittest.main()
