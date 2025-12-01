/**
 * Average Calculation Utilities
 *
 * Functions for calculating the average of interval strength values.
 * The average is computed from all available interval columns.
 */

import { STRENGTH_INTERVALS, StrengthInterval } from "./constants";

/**
 * Calculate the average of all interval values.
 * Only includes non-null values in the calculation.
 *
 * @param intervalValues - Object with interval column values
 * @returns Average of non-null values, or null if all values are null
 */
export function calculateAverage(
  intervalValues: Record<StrengthInterval, number | null> | Record<string, number | null>
): number | null {
  let sum = 0;
  let count = 0;

  for (const interval of STRENGTH_INTERVALS) {
    const rawValue = intervalValues[interval];
    // Convert to number explicitly (PostgreSQL may return strings)
    const value = rawValue !== null && rawValue !== undefined ? Number(rawValue) : null;
    
    if (value !== null && !isNaN(value) && isFinite(value)) {
      sum += value;
      count++;
    }
  }

  if (count === 0) {
    return null;
  }

  // Round to 2 decimal places for cleaner storage
  return Math.round((sum / count) * 100) / 100;
}

/**
 * Build interval values object from a database row.
 * Converts values to numbers (PostgreSQL may return strings).
 *
 * @param row - Database row with interval columns
 * @returns Object with interval values converted to numbers
 */
export function extractIntervalValues(row: Record<string, any>): Record<StrengthInterval, number | null> {
  const values: Record<string, number | null> = {};

  for (const interval of STRENGTH_INTERVALS) {
    const rawValue = row[interval];
    if (rawValue !== null && rawValue !== undefined) {
      const numValue = Number(rawValue);
      values[interval] = !isNaN(numValue) && isFinite(numValue) ? numValue : null;
    } else {
      values[interval] = null;
    }
  }

  return values as Record<StrengthInterval, number | null>;
}

/**
 * Merge new interval value into existing values and recalculate average.
 *
 * @param existingValues - Current interval values from the row
 * @param newInterval - The interval being updated
 * @param newValue - The new value for that interval
 * @returns Object with merged values and new average
 */
export function mergeAndCalculateAverage(
  existingValues: Record<StrengthInterval, number | null>,
  newInterval: StrengthInterval,
  newValue: number
): { values: Record<StrengthInterval, number | null>; average: number | null } {
  const merged = { ...existingValues };
  merged[newInterval] = newValue;

  return {
    values: merged,
    average: calculateAverage(merged),
  };
}

