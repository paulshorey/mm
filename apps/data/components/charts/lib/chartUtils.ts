import { LineData, Time } from 'lightweight-charts'
import { StrengthRowGet } from '@apps/common/sql/strength'

/**
 * Convert strength data to chart data using the specified intervals
 * If multiple intervals are provided, average their values
 */
export const convertToChartData = (
  data: StrengthRowGet[],
  control_intervals: string[]
): LineData[] => {
  return data
    .map((item) => {
      // Calculate average value across all specified intervals
      let sum = 0
      let count = 0

      for (const interval of control_intervals) {
        const value = item[interval as keyof StrengthRowGet]

        // Only include non-null values in the average
        if (value !== null && value !== undefined) {
          const numericValue =
            typeof value === 'string' ? parseFloat(value) : Number(value)

          if (Number.isFinite(numericValue)) {
            sum += numericValue
            count++
          }
        }
      }

      // Skip this data point if no valid values were found
      if (count === 0) return null

      // Calculate average
      const averageValue = sum / count

      return {
        time: (new Date(item.timenow).getTime() / 1000) as any,
        value: averageValue,
      }
    })
    .filter((item): item is LineData => item !== null) // Remove null values
}

/**
 * Calculate time range from raw data
 */
export const calculateTimeRange = (
  rawData: (StrengthRowGet[] | null)[],
  hoursBack: number
): { from: Time; to: Time } | null => {
  let latestOverallTime = 0
  let earliestOverallTime = Infinity

  // Find the overall time range across all tickers
  rawData.forEach((tickerData) => {
    if (tickerData && tickerData.length > 0) {
      const firstTime = tickerData[0]!.timenow.getTime() / 1000
      const lastTime =
        tickerData[tickerData.length - 1]!.timenow.getTime() / 1000
      earliestOverallTime = Math.min(earliestOverallTime, firstTime)
      latestOverallTime = Math.max(latestOverallTime, lastTime)
    }
  })

  if (latestOverallTime > 0 && earliestOverallTime < Infinity) {
    const hoursBackInSeconds = hoursBack * 60 * 60
    const startTime = Math.max(
      earliestOverallTime,
      latestOverallTime - hoursBackInSeconds
    )
    return {
      from: startTime as Time,
      to: latestOverallTime as Time,
    }
  }

  return null
}

/**
 * Aggregate strength data from all tickers
 * Creates a single chart data series that averages all interval values from all tickers
 */
export const aggregateStrengthData = (
  allRawData: (StrengthRowGet[] | null)[],
  control_intervals: string[]
): LineData[] => {
  // Create a map to store aggregated values by timestamp
  const aggregatedMap = new Map<number, { sum: number; count: number }>()

  // Process each ticker's data
  allRawData.forEach((tickerData) => {
    if (!tickerData) return

    tickerData.forEach((item) => {
      const timestamp = new Date(item.timenow).getTime() / 1000

      // Calculate average value across all specified intervals for this ticker
      let sum = 0
      let count = 0

      for (const interval of control_intervals) {
        const value = item[interval as keyof StrengthRowGet]

        if (value !== null && value !== undefined) {
          const numericValue =
            typeof value === 'string' ? parseFloat(value) : Number(value)

          if (Number.isFinite(numericValue)) {
            sum += numericValue
            count++
          }
        }
      }

      // Add this ticker's average to the aggregated map
      if (count > 0) {
        const averageValue = sum / count

        if (!aggregatedMap.has(timestamp)) {
          aggregatedMap.set(timestamp, { sum: 0, count: 0 })
        }

        const existing = aggregatedMap.get(timestamp)!
        existing.sum += averageValue
        existing.count++
      }
    })
  })

  // Convert map to sorted LineData array
  const result: LineData[] = []
  aggregatedMap.forEach((value, timestamp) => {
    if (value.count > 0) {
      result.push({
        time: timestamp as Time,
        value: value.sum / value.count,
      })
    }
  })

  // Sort by time
  return result.sort((a, b) => (a.time as number) - (b.time as number))
}

/**
 * Get price data for a single ticker
 * Creates a chart data series for the price values of a specific ticker
 */
export const getSingleTickerPriceData = (
  allRawData: (StrengthRowGet[] | null)[],
  controlTickers: string[],
  selectedTicker: string
): LineData[] => {
  // Find the index of the selected ticker
  const tickerIndex = controlTickers.indexOf(selectedTicker)
  if (tickerIndex === -1 || !allRawData[tickerIndex]) {
    return []
  }

  const tickerData = allRawData[tickerIndex]!
  const result: LineData[] = []

  // Process the selected ticker's data
  tickerData.forEach((item) => {
    if (
      item.price !== null &&
      item.price !== undefined &&
      item.price !== 0 &&
      Number.isFinite(item.price)
    ) {
      result.push({
        time: (new Date(item.timenow).getTime() / 1000) as Time,
        value: item.price,
      })
    }
  })

  // Sort by time
  return result.sort((a, b) => (a.time as number) - (b.time as number))
}

/**
 * Aggregate price data from all tickers as a simple average
 * Creates a single chart data series that averages all price values from all tickers
 * using aggressive backfill and forward-fill to eliminate all gaps
 */
export const aggregatePriceData = (
  allRawData: (StrengthRowGet[] | null)[]
): LineData[] => {
  // Step 1: Collect all timestamps across all tickers
  const globalTimestamps = new Set<number>()
  allRawData.forEach((tickerData) => {
    if (tickerData && tickerData.length > 0) {
      tickerData.forEach((item) => {
        const timestamp = new Date(item.timenow).getTime() / 1000
        globalTimestamps.add(timestamp)
      })
    }
  })

  // Convert to sorted array for easier processing
  const sortedTimestamps = Array.from(globalTimestamps).sort((a, b) => a - b)

  if (sortedTimestamps.length === 0) {
    return []
  }

  // Step 2: Process each ticker with aggressive fill
  const processedTickers: {
    filledPrices: Map<number, number>
    hasAnyData: boolean
  }[] = []

  allRawData.forEach((tickerData, tickerIndex) => {
    const filledPrices = new Map<number, number>()
    let lastKnownPrice: number | null = null
    let firstValidPrice: number | null = null
    let hasAnyValidData = false

    if (!tickerData || tickerData.length === 0) {
      processedTickers.push({
        filledPrices,
        hasAnyData: false,
      })
      return
    }

    // First pass: collect all valid prices
    const validPricesByTimestamp = new Map<number, number>()
    tickerData.forEach((item) => {
      const timestamp = new Date(item.timenow).getTime() / 1000
      if (
        item.price !== null &&
        item.price !== undefined &&
        item.price !== 0 &&
        Number.isFinite(item.price)
      ) {
        validPricesByTimestamp.set(timestamp, item.price)
        if (firstValidPrice === null) {
          firstValidPrice = item.price
        }
        lastKnownPrice = item.price
        hasAnyValidData = true
      }
    })

    // If this ticker has no valid prices at all, skip it
    if (!hasAnyValidData) {
      processedTickers.push({
        filledPrices,
        hasAnyData: false,
      })
      return
    }

    // Second pass: aggressively fill ALL timestamps
    let previousPrice: number | null = null

    for (let i = 0; i < sortedTimestamps.length; i++) {
      const timestamp = sortedTimestamps[i]!
      const existingPrice = validPricesByTimestamp.get(timestamp)

      if (existingPrice !== undefined) {
        // We have a valid price at this timestamp
        filledPrices.set(timestamp, existingPrice)
        previousPrice = existingPrice
      } else {
        // Missing price - need to fill
        let filledPrice: number | null = null

        // Look backward for the most recent valid price
        if (previousPrice !== null) {
          filledPrice = previousPrice
        } else {
          // No previous price yet, look forward
          for (let j = i + 1; j < sortedTimestamps.length; j++) {
            const futurePrice = validPricesByTimestamp.get(sortedTimestamps[j]!)
            if (futurePrice !== undefined) {
              filledPrice = futurePrice
              break
            }
          }
        }

        // If we found a price to use, set it
        if (filledPrice !== null) {
          filledPrices.set(timestamp, filledPrice)
          // Don't update previousPrice here as it's not a "real" price
        }
      }
    }

    processedTickers.push({
      filledPrices,
      hasAnyData: hasAnyValidData,
    })
  })

  // Filter to only tickers with data
  const tickersWithData = processedTickers.filter((t) => t.hasAnyData)

  if (tickersWithData.length === 0) {
    return []
  }

  // Step 3: Create simple averaged result
  const result: LineData[] = []

  sortedTimestamps.forEach((timestamp) => {
    let priceSum = 0
    let validCount = 0

    tickersWithData.forEach((ticker) => {
      const price = ticker.filledPrices.get(timestamp)
      if (price !== undefined && Number.isFinite(price)) {
        priceSum += price
        validCount++
      }
    })

    // Only add if we have data from all tickers (they should all have filled data)
    if (validCount === tickersWithData.length && validCount > 0) {
      result.push({
        time: timestamp as Time,
        value: priceSum / validCount, // Simple average
      })
    }
  })

  return result
}

/**
 * Get nearest series value at a specific time using binary search
 * If multiple intervals are provided, average their values
 */
export const getNearestSeriesValueAtTime = (
  chartData: LineData[] | null | undefined,
  t: Time,
  chartIndex: number,
  rawData: (StrengthRowGet[] | null)[],
  control_intervals: string[]
): number | null => {
  const tickerRawData = rawData[chartIndex]
  if (
    !tickerRawData ||
    !chartData ||
    typeof t !== 'number' ||
    tickerRawData.length === 0
  )
    return null
  const target = t as number

  // Binary search to find nearest index by timenow in raw data
  let left = 0
  let right = tickerRawData.length - 1
  while (left <= right) {
    const mid = (left + right) >> 1
    const midTime = tickerRawData[mid]!.timenow.getTime() / 1000
    if (midTime === target) {
      left = mid
      right = mid - 1
      break
    }
    if (midTime < target) left = mid + 1
    else right = mid - 1
  }

  // Candidates are at indices right and left
  let idx = right
  if (left >= 0 && left < tickerRawData.length) {
    if (right < 0) idx = left
    else {
      const leftTime = tickerRawData[left]!.timenow.getTime() / 1000
      const rightTime = tickerRawData[right]!.timenow.getTime() / 1000
      idx =
        Math.abs(leftTime - target) < Math.abs(rightTime - target)
          ? left
          : right
    }
  } else if (right < 0) {
    idx = 0
  } else if (right >= tickerRawData.length) {
    idx = tickerRawData.length - 1
  }

  idx = Math.max(0, Math.min(idx, tickerRawData.length - 1))

  // Calculate average value across all specified intervals
  let sum = 0
  let count = 0

  for (const interval of control_intervals) {
    const raw = tickerRawData[idx]![interval as keyof StrengthRowGet]

    if (raw !== null && raw !== undefined) {
      const value = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
      if (Number.isFinite(value)) {
        sum += value
        count++
      }
    }
  }

  // Return null if no valid values found, otherwise return average
  return count > 0 ? sum / count : null
}
