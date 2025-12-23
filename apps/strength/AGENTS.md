# Strength App

Financial charting app that displays strength (similar to RSI) and price data with real-time updates.

## Overview

- **Left y-axis**: Strength data (ranges from -100 to 100)
- **Right y-axis**: Price data
- **X-axis**: Time (shared between both series)

User controls which tickers to display; both strength and price charts show the same tickers.

## Folder Structure

```
apps/strength/
├── app/                      # Next.js app directory
│   ├── page.tsx              # Main page
│   └── api/v1/strength/      # API endpoint for data
│
├── charts/                   # Chart mini-app (see charts/AGENTS.md)
│   ├── SyncedCharts.tsx      # Main chart orchestrator
│   ├── lib/data/             # Data fetching and real-time updates
│   ├── lib/workers/          # Web Worker for aggregation
│   ├── lib/aggregation/      # Data aggregation functions
│   └── state/                # Zustand store + URL sync
│
└── components/               # Shared UI components
```

## Data Flow

1. **User selects tickers** via UI controls
2. **Historical data loaded** (up to 240 hours)
3. **Real-time polling starts** (every 10 seconds)
4. **Data aggregated** in Web Worker
5. **Chart renders** with dual y-axes

See `charts/AGENTS.md` for detailed data flow documentation.
See `charts/lib/data/AGENTS.md` for historical vs real-time data handling.

## Key Technical Details

### Timestamps

- All data is at **1-minute intervals**
- Seconds and milliseconds must be **0**
- The `timenow` field from database is the chart x-axis timestamp

### Real-Time Updates

- Polls every **10 seconds** for latest data
- Fetches last **4 minutes** to catch updates
- Merges new data with existing (updates same timestamps)
- Forward-fills null interval values

### Performance

- **Web Worker**: Aggregation runs off main thread
- **dataVersion**: Prevents stale data after ticker changes
- **Efficient merging**: Uses timestamp as unique key

## Database

Strength data is stored in PostgreSQL. See `@lib/common/sql/strength/` for:
- `gets.ts` - Query functions
- `adds.ts` - Insert functions
- `types.ts` - Data types (`StrengthRowGet`)
