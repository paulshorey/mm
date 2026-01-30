# Stream Chart

Real-time financial chart using `lightweight-charts` to display price, CVD, RSI, and various market metrics with absorption detection markers.

## Folder Structure

```
stream/
├── Wrapper.tsx           # Full-screen wrapper with 2x retina scaling
├── Chart.tsx             # Main chart component
├── useChartEventPatcher.ts  # Fixes mouse events for 2x scale factor
├── lib/
│   ├── constants.ts      # Configuration and field indices
│   ├── dataTransformers.ts  # CandleTuple → chart data converters
│   └── indicators.ts     # RSI, absorption detection, time formatting
└── hooks/
    ├── useChartSetup.ts  # Chart initialization and series creation
    └── useDataPolling.ts # Data fetching and real-time updates
```

## Data Flow

```
1. StreamChartWrapper (Wrapper.tsx)
   └── Calculates screen dimensions with 2x scale factor

2. Chart (Chart.tsx)
   ├── useChartEventPatcher() - patches mouse coordinates
   ├── useChartSetup() - creates chart + 14 series
   └── useDataPolling() - fetches data, updates series

3. Initial Load:
   fetchCandles(SCREEN_CANDLES)
   → updateChartData(candles)
   → startPolling()

4. Polling Loop (every 1s):
   pollLatest()
   → fetchCandles(RECENT_CANDLES)
   → applyRecentCandles()
   → updateChartData()
```

## Key Files

### `lib/constants.ts`

- **`IDX`** - Field indices for `CandleTuple` (30 fields: OHLC, CVD, EVR, VWAP, etc.)
- **`SERIES`** - Series configuration (enabled, color, scale margins)
- **`COLORS`** - Chart theme colors
- **`ABSORPTION_MARKER`** - Vertical line marker config

### `lib/dataTransformers.ts`

Converts `CandleTuple[]` to chart-compatible formats:

| Function                     | Output     | Series         |
| ---------------------------- | ---------- | -------------- |
| `candlesToPriceOhlc`         | BarData[]  | Price          |
| `candlesToCvdOhlc`           | BarData[]  | CVD (inverted) |
| `candlesToVwapOhlc`          | BarData[]  | VWAP           |
| `candlesToBookImbalanceData` | LineData[] | Book Imbalance |
| ...                          | ...        | 13 total       |

### `lib/indicators.ts`

- **`calculateRSI(candles, period)`** - Wilder's RSI with edge case handling
- **`detectAbsorptionPoints(candles)`** - Returns timestamps where:
  - Price movement divergence exists
  - `spread_bps_close != null` (spread data exists)
  - `big_trades > 0` (institutional trades)
- **`timeFormatter(time)`** - Formats timestamps as `M/D HH:MM`

### `hooks/useChartSetup.ts`

Creates the chart and all series. Returns:

```typescript
{
  chartRef,      // IChartApi reference
  seriesRefs: {  // All 11 series refs
    price, cvd, rsi, evr, vwap,
    spreadBps, pricePct, bookImbalance, bigTrades,
    bigVolume, vdStrength
  },
  absorptionRefs: { markers, timestamps },
  hasInitialized
}
```

Also sets up:

- Zoom handler (Cmd/Ctrl + scroll, anchored on last bar)
- Chart cleanup on unmount

### `hooks/useDataPolling.ts`

Data fetching and updates. Returns:

```typescript
{
  fetchCandles(limit), // Fetch from API
    updateChartData(candles), // Update all series + absorption markers
    applyRecentCandles(candles), // Merge new candles into existing
    startPolling(), // Start 1s interval
    stopPolling() // Clear interval
}
```

## Series Configuration

Series are stacked vertically using `scaleMargins` (top/bottom as 0-1 ratios):

| Series                           | Position    | Scale ID                         |
| -------------------------------- | ----------- | -------------------------------- |
| Price                            | Top (0-0.5) | right                            |
| VWAP                             | Top (0-0.5) | right (shared)                   |
| CVD                              | Upper-mid   | left                             |
| RSI                              | Mid         | rsi                              |
| EVR                              | Mid-lower   | evr                              |
| pricePct                         | Lower       | pricePct                         |
| bookImbalance                    | Lower       | bookImbalance                    |
| bigTrades, bigVolume, vdStrength | Bottom      | bigTrades, bigVolume, vdStrength |

## Absorption Markers

Yellow vertical dotted lines appear at candles meeting all criteria in `detectAbsorptionPoints()`. Markers are attached to the price series and tracked by timestamp to avoid duplicates.

## Documentation

After you edit any of the concepts mentioned here, update this file ./apps/strength/stream/AGENTS.md with the changes. Keep this file concise and accurate.
