# Data Aggregation

Functions for aggregating strength and price data across multiple tickers and intervals.

## Files

### aggregateDataUtils.ts

Shared utilities for data processing:

- `extractGlobalTimestamps()` - Extract all unique timestamps from multiple data arrays
- `forwardFillData()` - Forward-fill missing values in data (aggressive interpolation)
- `extendDataIntoFuture()` - Extend LineData array into future with last known value
- `generateFutureTimestamps()` - Generate future timestamps at 1-minute intervals
- `aggregateStrengthDataWithInterpolation()` - Forward-fill and aggregate strength data
- `normalizeMultipleTickerData()` - (Deprecated) Normalize price data across tickers

### aggregateStrengthData.ts

Strength data aggregation for left y-axis:

- `aggregateStrengthData()` - Average selected intervals across all tickers (main line)
- `aggregateStrengthByInterval()` - Separate line for each selected interval

### aggregatePriceData.ts

Price data aggregation for right y-axis:

- `aggregatePriceData()` - Normalized average of all tickers (main line)
- `aggregatePriceByTicker()` - Separate normalized line for each ticker

**Important**: Both price functions share a normalization context (`processTickersForNormalization`) to ensure individual ticker lines converge to the same point at the chart's right edge.

## Data Flow

```
Raw Data (StrengthRowGet[])
      ↓
extractGlobalTimestamps() - collect all unique timestamps
      ↓
forwardFillData() - fill missing values with forward-fill
      ↓
aggregate/normalize - combine data across tickers/intervals
      ↓
extendDataIntoFuture() - add 12 hours of flat line projection
      ↓
LineData[] - ready for chart rendering
```

## Price Normalization

Each ticker's prices are normalized relative to its last valid price:

1. Divide each price by the ticker's last price (so last = 1.0)
2. Calculate average of all tickers' last prices (`avgLastPrice`)
3. Scale normalized values by `avgLastPrice` for meaningful absolute values

This ensures:
- Individual ticker lines converge at the right edge
- The aggregated line passes through the average of individual lines
- Visual consistency between aggregated and individual price lines

