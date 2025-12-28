import { LineData, Time } from 'lightweight-charts'

/**
 * Compute the price indicator from price average data
 *
 * This is the main entry point for price indicator computation.
 * Expand this function to add more sophisticated indicator logic.
 *
 * @param priceAverage - The aggregated price average data
 * @returns The computed indicator series
 */
export function computePriceIndicator(
  priceAverage: LineData<Time>[] | null
): LineData<Time>[] | null {
  // Currently uses a 200-period Exponential Moving Average (EMA)
  // EMA gives more weight to recent prices, making it more responsive than SMA
  return exponentialMovingAverage(priceAverage, 200)
}

/**
 * Compute an Exponential Moving Average (EMA) from LineData
 *
 * EMA formula: EMA(t) = Price(t) * multiplier + EMA(t-1) * (1 - multiplier)
 * where multiplier = 2 / (period + 1)
 *
 * @param data - The source data (e.g., priceAverage)
 * @param period - Number of periods for the EMA (e.g., 200)
 * @returns EMA data with same time points, null for insufficient data
 */
function exponentialMovingAverage(
  data: LineData<Time>[] | null,
  period: number
): LineData<Time>[] | null {
  if (!data || data.length === 0) return null

  // Need at least 'period' points to start calculating EMA
  if (data.length < period) {
    // Return null values for all points when insufficient data
    return data.map((point) => ({
      time: point.time,
      value: 0, // Will be filtered out by chart or shown as no line
    }))
  }

  const result: LineData<Time>[] = []
  const multiplier = 2 / (period + 1)

  // Calculate initial SMA for the first 'period' points to seed the EMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]!.value
  }
  const initialSMA = sum / period

  // First EMA value (at index period-1) is the SMA
  let ema = initialSMA

  // Add null values for points before we have enough data
  for (let i = 0; i < period - 1; i++) {
    result.push({
      time: data[i]!.time,
      value: 0, // Placeholder, will render as gap in chart
    })
  }

  // Add the first EMA point (using SMA as seed)
  result.push({
    time: data[period - 1]!.time,
    value: ema,
  })

  // Calculate EMA for remaining points
  for (let i = period; i < data.length; i++) {
    ema = data[i]!.value * multiplier + ema * (1 - multiplier)
    result.push({
      time: data[i]!.time,
      value: ema,
    })
  }

  return result
}
