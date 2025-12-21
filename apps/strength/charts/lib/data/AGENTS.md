# Data Fetching

API client and React hook for fetching real-time strength data.

## Files

### FetchStrengthData.ts

Service class for fetching strength data from the API:

- `fetchTickerData()` - Fetch data for a single ticker
- `fetchMultipleTickersData()` - Fetch data for multiple tickers in parallel
- `mergeData()` - Merge new data with existing data, handling duplicates
- `prepareDate()` - Prepare date for API query (sets seconds/milliseconds to 0)
- `getInitialDataDate()` - Get the start date for initial data load

**Important**: All timestamps are at 1-minute intervals with no seconds.

### useRealtimeStrengthData.ts

React hook for managing real-time strength data updates:

- Fetches initial historical data (configurable hours back)
- Polls for new data every minute (configurable interval)
- Merges new data with existing data
- Forward-fills missing strength values from historical data
- Handles the "unreliable latest row" issue by using the second-to-last row

**Usage**:

```typescript
const { rawData, isLoading, error, lastUpdateTime, isRealtime } =
  useRealtimeStrengthData({
    tickers: ['BTC-USD', 'ETH-USD'],
    enabled: true,
    maxDataHours: 36,
    updateIntervalMs: 60000, // 1 minute
  })
```

## Real-time Update Strategy

The hook fetches the last TWO 1-minute intervals on each update:

1. The **current interval** might be empty (pre-created row with just timestamp)
2. The **previous interval** might still be receiving updates
3. Uses forward-fill from historical data to fill missing strength values

This ensures reliable real-time updates without displaying incomplete data.

