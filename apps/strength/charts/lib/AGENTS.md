# Charts Library Files

Utilities and functions for chart rendering, data processing, and real-time updates.

## Folder Structure

```
lib/
├── data/               # Data fetching (@data/AGENTS.md)
│   ├── FetchStrengthData.ts
│   └── useRealtimeStrengthData.ts
├── aggregation/        # Data aggregation (@aggregation/AGENTS.md)
│   ├── aggregateDataUtils.ts
│   ├── aggregatePriceData.ts
│   └── aggregateStrengthData.ts
├── primitives/         # Custom chart primitives (@primitives/AGENTS.md)
│   ├── TimeRangeHighlight.ts
│   ├── VerticalLinePrimitive.ts
│   ├── timeMarkers.ts
│   └── forwardFillData.ts
├── chartConfig.ts      # Chart styling and configuration
└── chartUtils.ts       # Time range calculations, formatting
```

## Data Fetching (@data/AGENTS.md)

- **FetchStrengthData.ts** - API client for fetching strength data
- **useRealtimeStrengthData.ts** - React hook: polls for new data every minute

## Data Aggregation (@aggregation/AGENTS.md)

- **aggregateStrengthData.ts** - Aggregate strength data across tickers/intervals
- **aggregatePriceData.ts** - Aggregate and normalize price data
- **aggregateDataUtils.ts** - Shared utilities (timestamps, forward-fill, extend future)

## Custom Primitives (@primitives/AGENTS.md)

- **TimeRangeHighlight.ts** - Shaded background regions for market hours
- **VerticalLinePrimitive.ts** - Vertical line markers for events
- **timeMarkers.ts** - Configuration for time ranges and markers
- **forwardFillData.ts** - Add data points at time range boundaries

## Chart Configuration

- **chartConfig.ts** - Chart options, dual y-axes configuration
- **chartUtils.ts** - Time range calculations, data formatting

## Related Documentation

- `@primitives/AGENTS.md` - Custom primitives implementation details
- `@aggregation/AGENTS.md` - Data aggregation and normalization
- `@data/AGENTS.md` - Data fetching and real-time updates
