# Data Fetching

API client and React hooks for fetching strength data with real-time updates.

## Files

- **FetchStrengthData.ts** - API service class for fetching and merging data
- **useStrengthData.ts** - Controlled data fetching hook (RECOMMENDED)
- **useRealtimeStrengthData.ts** - Legacy hook, kept for backwards compatibility

## Data Flow Overview

```
User selects tickers
      ↓
useStrengthData (state machine: idle → loading → ready)
      ↓
Historical fetch (up to 240 hours of data)
      ↓
Start real-time polling (every 10 seconds)
      ↓
Dynamic window calculation → Fetch → Forward-fill → Merge → Trigger re-aggregation
```

## Historical vs Real-Time Data

### Historical Data (Initial Load)

When user selects tickers or page loads:

1. Stop any existing real-time polling
2. Clear existing data, set `dataState = 'loading'`
3. Increment `dataVersion` (triggers chart reset)
4. Fetch all data from `HOURS_BACK_INITIAL` (240 hours) to now
5. Set `dataState = 'ready'`
6. Start real-time polling

### Real-Time Data (Polling)

After initial load, every **10 seconds** (`updateIntervalMs: 10000`):

1. Calculate dynamic fetch window (based on time since last successful fetch)
2. Fetch data for calculated window
3. Forward-fill null interval values from existing historical data
4. Merge into existing data (updates same timestamps, adds new ones)
5. `setRawData()` triggers re-aggregation in `SyncedCharts`

## Background Tab Recovery

When the browser tab is in the background, JavaScript execution is limited and polling may not run consistently. The hook handles this automatically:

### Dynamic Fetch Window

Instead of always fetching 4 minutes, the hook calculates a dynamic window:

```typescript
const minutesSinceLastFetch = (now - lastSuccessfulFetch) / 60000
const fetchMinutes = Math.max(4, minutesSinceLastFetch + 2) // +2 minute buffer
// Capped at 120 minutes (2 hours max)
```

### Visibility Change Detection

When the tab becomes visible again, an immediate fetch is triggered:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    fetchRealtimeUpdate() // Fills any gaps from background period
  }
})
```

### Example Scenario

1. User views chart at 10:00:00 - last successful fetch recorded
2. User switches to another tab at 10:00:30
3. Tab is in background, polling stops/slows
4. User returns at 10:15:00
5. Visibility change triggers immediate fetch
6. Dynamic window calculates: 15 minutes + 2 buffer = 17 minutes
7. Fetch retrieves all data from 09:58:00 to 10:15:00
8. Gap is filled, chart is up to date

## Forward-Fill Logic

### Problem: Intermittent Missing Strength Lines

Previously, the first row of new data was NOT forward-filled from existing historical data. If new data had null intervals but valid price, only price would update.

### Solution: Forward-Fill from Historical Context

```typescript
// Find the last complete row from existing data
const lastCompleteRow = findLastCompleteRow(existingData)

// Forward-fill first row of new data from historical context
if (i === 0) {
  filledNewData.push(forwardFillRow(currentRow, lastCompleteRow))
} else {
  // Subsequent rows forward-fill from previous new row
  filledNewData.push(forwardFillRow(currentRow, filledNewData[i - 1]))
}
```

This ensures continuity even when recent database rows have null intervals.

## Duplicate Fetch Prevention

A `isFetchingRef` prevents concurrent fetches:

```typescript
if (isFetchingRef.current) return
isFetchingRef.current = true
try {
  // ... fetch logic
} finally {
  isFetchingRef.current = false
}
```

## State Machine (`useStrengthData`)

```
IDLE (no tickers) ←→ LOADING (fetching historical) → READY (polling active)
                          ↑                              ↓
                          └──── ticker change ───────────┘
```

- **idle**: No tickers selected, no data
- **loading**: Fetching historical data, real-time paused
- **ready**: Data available, real-time polling active

## Key Configuration

```typescript
useStrengthData({
  tickers: chartTickers,
  enabled: true,
  maxDataHours: 240,        // HOURS_BACK_INITIAL
  updateIntervalMs: 10000,  // 10 seconds real-time polling
})

// Constants in useStrengthData.ts:
const MIN_FETCH_MINUTES = 4    // Minimum fetch window
const MAX_FETCH_MINUTES = 120  // Maximum fetch window (2 hours)
```
