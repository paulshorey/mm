# Data Fetching

API client and React hooks for fetching strength data.

## Files

**FetchStrengthData.ts** - API service class:
- `fetchTickerData()` / `fetchMultipleTickersData()` - Fetch from API
- `mergeData()` - Merge new data with existing, update same timestamps
- `prepareDate()` - Ensure 1-minute intervals (no seconds)

**useStrengthData.ts** - Controlled data fetching hook (RECOMMENDED):
- State machine approach: `idle` → `loading` → `ready`
- Automatic pause of real-time updates when tickers change
- Clears stale data before fetching new data
- `dataVersion` increments on ticker change for chart reset

**useRealtimeStrengthData.ts** - Legacy real-time data hook:
- Older implementation, kept for backwards compatibility
- Less controlled state management

## Controlled Data Flow (useStrengthData)

When user changes tickers:
1. Stop real-time updates
2. Clear existing data (`rawData = []`)
3. Set `dataState = 'loading'`
4. Increment `dataVersion` (triggers chart remount)
5. Fetch historical data
6. Set `dataState = 'ready'`
7. Resume real-time updates (10-second polling)

This prevents race conditions where old data overwrites new data.

## Real-time Strategy (10-second polling)

Database rows exist at 1-minute intervals but are updated every few seconds.

On each 10-second poll:
1. Fetch last 4 minutes of data
2. Forward-fill null interval values from previous rows
3. Merge into existing data (same timestamps get UPDATED)
4. Worker re-aggregates the updated data

