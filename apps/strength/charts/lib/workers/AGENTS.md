# Web Workers

This folder contains Web Worker implementations for offloading heavy computations from the main thread.

## Files

- **aggregation.worker.ts**: Self-contained Web Worker that performs all data aggregation
  - Strength data aggregation (average of intervals across tickers)
  - Price data aggregation (normalized average of all tickers)
  - Individual interval strength data
  - Individual ticker price data
  - Echoes back `requestId` for race condition handling
  - Note: All aggregation logic is duplicated (inlined) from `/lib/aggregation/` to avoid import issues in workers

- **useAggregationWorker.ts**: React hook that manages the worker lifecycle
  - Creates/terminates worker on mount/unmount
  - Serializes data before sending to worker (Dates → ISO strings)
  - **Request ID tracking**: Each request gets a unique ID to handle race conditions
  - **Stale request filtering**: Results from old requests are ignored
  - `cancelPending()`: Mark all pending requests as stale (used when tickers change)

- **types.ts**: Shared types for worker communication
  - `WorkerStrengthRow`: Serializable version of `StrengthRowGet`
  - `AggregationWorkerRequest/Response`: Message types with `requestId`

## Why Web Workers?

Aggregation involves processing thousands of data points with complex calculations (forward-fill, normalization, averaging). Running this on the main thread causes UI freezes during real-time updates.

Workers run in a separate thread, keeping the UI responsive.

## Race Condition Handling

When tickers change, there can be multiple requests in flight. The `requestId` system ensures:
1. Each request gets a unique ID
2. When tickers change, `cancelPending()` marks all pending requests as stale
3. Worker results with stale requestIds are ignored
4. Only the latest valid result updates the chart

## Usage

```tsx
const { aggregate, isProcessing, cancelPending } = useAggregationWorker({
  onResult: (result, processingTimeMs, requestId) => { /* update store */ },
  onError: (error) => { /* handle error */ },
})

// Cancel pending when data source changes
useEffect(() => {
  if (tickersChanged) {
    cancelPending()
  }
}, [tickers])

// Trigger aggregation (sends data to worker)
aggregate(rawData, intervals, tickers)
```

