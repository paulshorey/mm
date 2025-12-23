# Charts Mini-App

Financial charting system built on `lightweight-charts` (v5.0.8). Renders dual y-axis charts showing strength (left) and price (right) data with real-time updates.

## Folder Structure

```
charts/
├── SyncedChartsWrapper.tsx   # Entry point - waits for dimensions + hydration
├── SyncedCharts.tsx          # Orchestrates data flow to charts
├── constants.ts              # Chart colors, default values
├── classes.module.scss       # Shared styles
│
├── components/
│   ├── Chart.tsx             # Core chart rendering
│   ├── ChartTitle.tsx        # Title with ticker/aggregation info
│   ├── ChartStates.tsx       # Loading/error states
│   ├── Header.tsx            # Top controls bar
│   ├── UpdatedTime.tsx       # Last update timestamp
│   └── controls/             # Ticker, interval, date selectors
│
├── lib/
│   ├── data/                 # Data fetching (see lib/data/AGENTS.md)
│   ├── aggregation/          # Data aggregation (see lib/aggregation/AGENTS.md)
│   ├── workers/              # Web Workers (see lib/workers/AGENTS.md)
│   ├── primitives/           # Custom chart primitives (see lib/primitives/AGENTS.md)
│   ├── chartConfig.ts        # Chart styling config
│   └── chartUtils.ts         # Time range calculations
│
└── state/
    ├── useChartControlsStore.ts  # Zustand store for UI controls
    └── urlSync.ts                # URL query param sync
```

## Data Flow

```
URL Query Params
      ↓
useChartControlsStore (Zustand) - hydrates from URL
      ↓
SyncedChartsWrapper - waits for dimensions + hydration
      ↓
SyncedCharts - orchestrates data flow
      ↓
useStrengthData - fetches data, manages polling (every 10s)
      ↓
Debounce (500ms min) + Hash comparison
      ↓
Web Worker - aggregates data off main thread (~1000-1500ms)
      ↓
Chart.tsx - renders when data ready
```

### Ticker Change Flow

1. User selects tickers → `dataState = 'loading'`, `dataVersion++`
2. Real-time polling paused, chart cleared
3. Historical data fetched (up to 240 hours)
4. Worker aggregates → Chart renders
5. Real-time polling resumes (every 10 seconds)

### Real-Time Update Flow

Every 10 seconds while `dataState === 'ready'`:

1. Calculate dynamic fetch window (based on time since last fetch)
2. Fetch data for calculated window (4 min minimum, up to 2 hours if returning from background)
3. Forward-fill null intervals from existing historical data
4. Merge into existing data
5. Debounce (500ms min between aggregations)
6. Skip if data hash unchanged
7. Worker re-aggregates
8. Chart updates

### Background Tab Recovery

When tab is in background, JavaScript execution is limited. On return:
- Visibility change event triggers immediate fetch
- Dynamic window calculates time since last successful fetch
- All missing data is fetched in one request (up to 2 hours max)

**See `lib/data/AGENTS.md`** for detailed documentation on historical vs real-time data.

## Performance Optimizations

### Problem Solved: Infinite Aggregation Loop

Previously, the aggregation effect had `isProcessing` in its dependency array. When aggregation completed, `isProcessing` changed, triggering another aggregation in an infinite loop (~every 2 seconds).

**Solution:**
- Use refs instead of state for processing flag
- Add 500ms debounce between aggregations
- Skip aggregation if rawData hash hasn't changed

### Current Optimizations

1. **Debouncing**: 500ms minimum gap between aggregations
2. **Hash comparison**: Skip if rawData hasn't changed
3. **Refs for state**: `isProcessingRef` doesn't trigger re-renders
4. **Web Worker**: Aggregation runs off main thread

## Chart Lines

**Always visible:**
- **Strength** (orange, left axis) - average of selected intervals across all tickers
- **Price** (blue, right axis) - normalized average of all selected tickers

**Optional toggles:**
- **Individual interval lines** - each interval separately (2m, 4m, 12m, etc.)
- **Individual ticker price lines** - each ticker separately, normalized

## Related Documentation

- `lib/data/AGENTS.md` - Historical vs real-time data, polling strategy, optimizations
- `lib/workers/AGENTS.md` - Web Worker and race condition prevention
- `lib/aggregation/AGENTS.md` - Data aggregation and price normalization
- `lib/primitives/AGENTS.md` - Custom chart primitives
- `state/AGENTS.md` - Zustand store and URL sync
