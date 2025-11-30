/**
 * Forward Fill Data Utility
 *
 * Ensures data exists at regular intervals by filling gaps with the last known value.
 * This is essential for time range highlighting to work reliably, as lightweight-charts
 * only knows about timestamps that have actual data points.
 */

import { LineData, Time } from 'lightweight-charts'

/**
 * Default interval is 2 minutes (120 seconds) to match our data granularity.
 */
const DEFAULT_INTERVAL_SECONDS = 120

/**
 * Forward-fill data to ensure no time gaps exist.
 *
 * This function:
 * 1. Takes existing data points
 * 2. Fills any gaps with the last known value
 * 3. Returns a continuous timeline with no missing intervals
 *
 * @param data - Original data array (must be sorted by time ascending)
 * @param intervalSeconds - Interval between data points (default: 120 = 2 minutes)
 * @param requiredTimestamps - Optional array of specific timestamps that MUST exist
 * @returns Data array with gaps filled
 */
export function forwardFillData(
  data: LineData[],
  intervalSeconds: number = DEFAULT_INTERVAL_SECONDS,
  requiredTimestamps?: number[]
): LineData[] {
  if (data.length === 0) return data

  // Create a map for O(1) lookup of existing data
  const dataMap = new Map<number, LineData>()
  data.forEach((d) => dataMap.set(d.time as number, d))

  const startTime = data[0]!.time as number
  const endTime = data[data.length - 1]!.time as number

  // Collect all times that need to exist
  const requiredTimes = new Set<number>()

  // Add all regular interval times
  for (let t = startTime; t <= endTime; t += intervalSeconds) {
    requiredTimes.add(t)
  }

  // Add any specifically required timestamps (e.g., time range boundaries)
  if (requiredTimestamps) {
    requiredTimestamps.forEach((ts) => {
      // Only add if within or very close to data range
      if (ts >= startTime - intervalSeconds && ts <= endTime + intervalSeconds) {
        requiredTimes.add(ts)
      }
    })
  }

  // Sort all required times
  const sortedTimes = Array.from(requiredTimes).sort((a, b) => a - b)

  // Build result with forward-fill
  const result: LineData[] = []
  let lastValue = data[0]!.value

  for (const t of sortedTimes) {
    const existing = dataMap.get(t)

    if (existing) {
      // Use existing data point
      result.push(existing)
      lastValue = existing.value
    } else {
      // Forward-fill with last known value
      result.push({ time: t as Time, value: lastValue })
    }
  }

  return result
}

/**
 * Extract all time range boundary timestamps from the configuration.
 *
 * @param configs - Time range configurations
 * @param dataStartTime - Start of data range (unix timestamp)
 * @param dataEndTime - End of data range (unix timestamp)
 * @returns Array of timestamps where time ranges start or end
 */
export function getTimeRangeBoundaries(
  configs: Array<{
    startUtcHour: number
    startUtcMinute: number
    endUtcHour: number
    endUtcMinute: number
  }>,
  dataStartTime: number,
  dataEndTime: number
): number[] {
  const boundaries: number[] = []
  const startDate = new Date(dataStartTime * 1000)
  const endDate = new Date(dataEndTime * 1000)

  configs.forEach((config) => {
    // Start from the beginning of the data range
    const currentDate = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        config.startUtcHour,
        config.startUtcMinute,
        0,
        0
      )
    )

    // If start time is before data start, move to that day's occurrence
    if (currentDate.getTime() < startDate.getTime() - 24 * 60 * 60 * 1000) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    // Find all occurrences within the data range (plus buffer)
    const bufferMs = 24 * 60 * 60 * 1000 // 1 day buffer
    while (currentDate.getTime() <= endDate.getTime() + bufferMs) {
      // Add start time
      boundaries.push(Math.floor(currentDate.getTime() / 1000))

      // Calculate and add end time
      let dayOffset = 0
      if (
        config.endUtcHour < config.startUtcHour ||
        (config.endUtcHour === config.startUtcHour &&
          config.endUtcMinute < config.startUtcMinute)
      ) {
        dayOffset = 1
      }

      const endTimeDate = new Date(
        Date.UTC(
          currentDate.getUTCFullYear(),
          currentDate.getUTCMonth(),
          currentDate.getUTCDate() + dayOffset,
          config.endUtcHour,
          config.endUtcMinute,
          0,
          0
        )
      )
      boundaries.push(Math.floor(endTimeDate.getTime() / 1000))

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
  })

  return boundaries
}

/**
 * Round a timestamp down to the nearest interval boundary.
 *
 * @param timestamp - Unix timestamp in seconds
 * @param intervalSeconds - Interval in seconds
 * @returns Rounded timestamp
 */
export function roundToInterval(
  timestamp: number,
  intervalSeconds: number = DEFAULT_INTERVAL_SECONDS
): number {
  return Math.floor(timestamp / intervalSeconds) * intervalSeconds
}
