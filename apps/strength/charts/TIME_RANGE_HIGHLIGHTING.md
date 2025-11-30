# Time Range Highlighting

Visual background shading for specific time periods on lightweight-charts (e.g., market hours).

## Overview

This feature draws semi-transparent colored rectangles behind chart data to highlight specific time ranges, such as US market hours or overnight sessions.

## Files

| File | Purpose |
|------|---------|
| `lib/TimeRangeHighlight.ts` | Custom primitive for rendering shaded rectangles |
| `lib/timeMarkers.ts` | Configuration for time ranges and vertical markers |
| `lib/forwardFillData.ts` | Utility ensuring data exists at time range boundaries |
| `lib/VerticalLinePrimitive.ts` | Vertical line markers (complementary feature) |

## Configuration

Time ranges are defined in `lib/timeMarkers.ts`:

```typescript
export const TIME_RANGE_HIGHLIGHTS: TimeRangeConfig[] = [
  {
    id: 'us-market-hours',
    startUtcHour: 14,
    startUtcMinute: 30,
    endUtcHour: 21,
    endUtcMinute: 0,
    color: 'rgba(33, 150, 243, 0.08)', // Light blue
  },
]
```

## How It Works

### The Challenge

Lightweight-charts uses a **non-linear time scale** that only knows about timestamps with actual data points:
- `timeToCoordinate(timestamp)` returns `null` for times without data
- If a time range starts at 14:30 but data starts at 14:32, the boundary can't be located

### Our Solution: Forward-Fill + Interpolation

1. **Forward-Fill Data** (`forwardFillData.ts`):
   - Ensures data points exist at 2-minute intervals
   - Explicitly adds data points at all time range boundaries
   - Uses last known value for filled points (flat lines during gaps)

2. **Interpolation Fallback** (`TimeRangeHighlight.ts`):
   - Direct lookup via `timeToCoordinate()` for times with data
   - Extrapolation for times before/after data range
   - Binary search + interpolation for any remaining gaps

### Visual Behavior

- **Market hours**: Shown with light colored background
- **Gaps (weekends/holidays)**: Appear as flat horizontal lines with consistent time spacing
- **Benefits**: Gaps visualize time passage; enables future comparison of different market hours (US Futures vs Crypto 24h)

## Architecture

```
TimeRangeHighlightPrimitive (ISeriesPrimitive)
├── TimeRangeHighlightPaneView (IPrimitivePaneView)
│   ├── update() - Calculates x-coordinates for each range
│   └── _timeToX() - Converts timestamps to coordinates with fallbacks
└── TimeRangeHighlightRenderer (IPrimitivePaneRenderer)
    └── draw() - Renders rectangles via Canvas API
```

## Usage in Chart.tsx

```typescript
// 1. Import utilities
import { TIME_RANGE_HIGHLIGHTS } from '@/charts/lib/timeMarkers'
import { TimeRangeHighlightPrimitive } from '@/charts/lib/TimeRangeHighlight'
import { forwardFillData, getTimeRangeBoundaries } from '@/charts/lib/forwardFillData'

// 2. Forward-fill data before setting
const prepareDataWithForwardFill = (data: LineData[]): LineData[] => {
  const requiredTimestamps = getTimeRangeBoundaries(TIME_RANGE_HIGHLIGHTS, dataStart, dataEnd)
  return forwardFillData(data, 120, requiredTimestamps) // 120s = 2 min intervals
}

// 3. Attach primitive to series
const highlight = new TimeRangeHighlightPrimitive(TIME_RANGE_HIGHLIGHTS)
highlight.setDataRange(dataTimestamps)
series.attachPrimitive(highlight)
```

## Limitations

1. **Performance**: Forward-fill adds more data points (minimal impact at 2-min intervals)
2. **Flat lines in gaps**: Gaps show as horizontal lines, not compressed space
3. **UTC-only**: All times configured in UTC; local timezone conversion not built-in
4. **Single day ranges**: Ranges crossing midnight work, but multi-day ranges not tested

## Future Enhancements

- [ ] Local timezone configuration
- [ ] Dynamic range updates (e.g., toggle market hours on/off)
- [ ] Different opacity/color per chart
- [ ] Labels for highlighted ranges
