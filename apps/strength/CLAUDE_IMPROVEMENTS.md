# Strength App - Data Flow Improvements

## Problem Analysis

The app had two main issues:
1. When selecting new Strength tickers, the entire page would reload (go white) instead of just filtering existing data
2. When selecting new Price tickers, the Price chart would not update at all

The root cause was inefficient data management:
- Data was fetched based on `controlTickers` (selected Strength tickers) instead of `marketTickers` (all available tickers)
- Changing Strength selection triggered a complete data refetch
- Price data aggregation wasn't properly filtering based on selected Price tickers

## Solution Implemented

### 1. Data Fetching Strategy
- **Changed**: Always fetch data for ALL `marketTickers` instead of just selected tickers
- **Location**: `/charts/SyncedCharts.tsx` line 65
- **Benefit**: Data is cached once for all market tickers, eliminating refetches when changing selections

### 2. Data Filtering Logic
- **Added**: Filter raw data based on selected tickers before aggregation
- **Location**: `/charts/SyncedCharts.tsx` lines 93-100
- **Implementation**:
  ```typescript
  const strengthIndices = controlTickers.map(ticker => marketTickers.indexOf(ticker)).filter(i => i >= 0)
  const priceIndices = priceTickers.map(ticker => marketTickers.indexOf(ticker)).filter(i => i >= 0)

  const strengthRawData = strengthIndices.map(i => rawData[i] || null)
  const priceRawData = priceIndices.map(i => rawData[i] || null)
  ```
- **Benefit**: Each chart only processes data for its selected tickers

### 3. Component Key Optimization
- **Changed**: Price chart key from `price-${JSON.stringify(priceTickers)}` to stable `"price-chart"`
- **Location**: `/charts/SyncedCharts.tsx` line 245
- **Benefit**: Prevents unnecessary chart remounting when selection changes

## Data Flow Architecture

### Current Flow:
1. **Market Selection** → Updates `marketTickers` → Triggers new data fetch for all market tickers
2. **Strength Selection** → Updates `controlTickers` → Filters existing data → Updates Strength chart only
3. **Price Selection** → Updates `priceTickers` → Filters existing data → Updates Price chart only

### Key Principles:
- **Cache Everything**: Fetch data for all tickers in the selected market
- **Filter on Display**: Apply ticker selection during aggregation, not fetching
- **Independent Charts**: Each chart updates independently without affecting the other

## Performance Benefits

1. **No Page Reloads**: Changing Strength/Price selections only updates the relevant chart
2. **Instant Updates**: Data filtering is instantaneous since data is already cached
3. **Smooth Transitions**: Charts update in-place without flickering or remounting
4. **Efficient Memory**: Data is fetched once and reused across selections

## Testing Recommendations

1. **Market Switch**: Select different markets and verify data refetch occurs only then
2. **Strength Selection**: Change Strength tickers and verify:
   - No loading spinner appears
   - Price chart remains unchanged
   - Strength chart updates smoothly
3. **Price Selection**: Change Price tickers and verify:
   - Price chart updates correctly
   - Strength chart remains unchanged
   - No unnecessary data fetching

## Future Improvements

1. **Data Persistence**: Consider caching data across market switches if the user returns to a previously selected market
2. **Incremental Loading**: For large datasets, consider loading visible range first, then background-loading the rest
3. **Error Recovery**: Add retry logic for failed data fetches without losing existing cached data