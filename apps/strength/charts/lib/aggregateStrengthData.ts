import { StrengthRowGet } from '@lib/common/sql/strength'
import { LineData, Time } from 'lightweight-charts'
import {
  aggregateStrengthDataWithInterpolation,
  extractGlobalTimestamps,
  generateFutureTimestamps,
} from './aggregateDataUtils'

/**
 * Structure for multiple strength series
 * - intervalSeries: array of series for each individual interval (rendered at 50% opacity)
 * - averageSeries: single series averaging all intervals (rendered at 100% opacity)
 */
export interface MultipleStrengthSeries {
  intervalSeries: Array<{ interval: string; data: LineData[] }>
  averageSeries: LineData[]
}

/**
 * Aggregate strength data from all tickers with interpolation
 * Creates multiple chart data series:
 * - One series for each individual interval (to be rendered with 50% opacity)
 * - One series for the average of all intervals (to be rendered with 100% opacity)
 * Uses forward-fill interpolation to handle missing values
 */
export const aggregateStrengthData = (
  allRawData: (StrengthRowGet[] | null)[],
  control_intervals: string[],
  allMarketData?: (StrengthRowGet[] | null)[] // Optional: all market data for consistent timestamps
): MultipleStrengthSeries => {
  // Extract all unique timestamps from ALL market data to ensure consistency
  // This prevents issues when switching between Average and individual tickers
  const dataForTimestamps = allMarketData || allRawData
  const sortedTimestamps = extractGlobalTimestamps(dataForTimestamps)

  if (sortedTimestamps.length === 0) {
    return {
      intervalSeries: [],
      averageSeries: [],
    }
  }

  // Helper function to extract strength value from an item for ALL intervals (averaging)
  const getAverageStrengthValue = (
    item: StrengthRowGet,
    intervals: string[]
  ): number | null => {
    let sum = 0
    let count = 0

    for (const interval of intervals) {
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

    return count > 0 ? sum / count : null
  }

  // Helper function to extract strength value for a SINGLE interval
  const getSingleIntervalStrengthValue = (
    item: StrengthRowGet,
    interval: string
  ): number | null => {
    const value = item[interval as keyof StrengthRowGet]

    if (value !== null && value !== undefined) {
      const numericValue =
        typeof value === 'string' ? parseFloat(value) : Number(value)

      if (Number.isFinite(numericValue)) {
        return numericValue
      }
    }

    return null
  }

  // Function to extend data 12 hours into the future
  const extendDataIntoFuture = (lineData: LineData[]): LineData[] => {
    if (lineData.length === 0) return lineData

    const result = [...lineData]
    const lastDataPoint = lineData[lineData.length - 1]!
    const lastTimestamp = lastDataPoint.time as number
    const lastValue = lastDataPoint.value

    // Generate future timestamps (12 hours at 2-minute intervals)
    const futureTimestamps = generateFutureTimestamps(lastTimestamp, 12)

    // Add future data points with the last known value
    futureTimestamps.forEach((timestamp) => {
      result.push({
        time: timestamp as Time,
        value: lastValue,
      })
    })

    return result
  }

  // Create series for each individual interval
  const intervalSeries = control_intervals.map((interval) => {
    const result = aggregateStrengthDataWithInterpolation(
      allRawData,
      sortedTimestamps,
      (item) => getSingleIntervalStrengthValue(item, interval),
      [interval] // Pass as array to maintain API compatibility
    )

    const lineData = result.map((point) => ({
      time: point.time as Time,
      value: point.value,
    }))

    return {
      interval,
      data: extendDataIntoFuture(lineData),
    }
  })

  // Create average series (current behavior)
  const averageResult = aggregateStrengthDataWithInterpolation(
    allRawData,
    sortedTimestamps,
    getAverageStrengthValue,
    control_intervals
  )

  const averageLineData = averageResult.map((point) => ({
    time: point.time as Time,
    value: point.value,
  }))

  return {
    intervalSeries,
    averageSeries: extendDataIntoFuture(averageLineData),
  }
}
