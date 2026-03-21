from __future__ import annotations

from collections import defaultdict, deque
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class PricePoint:
    timestamp: datetime
    close: float


@dataclass(frozen=True)
class MovingAveragePoint:
    timestamp: datetime
    value: float


def grouped_simple_moving_average(
    points: Iterable[PricePoint],
    slot_getter: Callable[[datetime], int],
    window_size: int = 20,
) -> list[MovingAveragePoint]:
    if window_size < 1:
        raise ValueError("window_size must be at least 1")

    windows: dict[int, deque[float]] = defaultdict(deque)
    running_totals: dict[int, float] = defaultdict(float)
    outputs: list[MovingAveragePoint] = []

    for point in points:
        slot = slot_getter(point.timestamp)
        window = windows[slot]
        if len(window) == window_size:
            running_totals[slot] -= window.popleft()

        window.append(point.close)
        running_totals[slot] += point.close

        outputs.append(
            MovingAveragePoint(
                timestamp=point.timestamp,
                value=running_totals[slot] / len(window),
            )
        )

    return outputs
