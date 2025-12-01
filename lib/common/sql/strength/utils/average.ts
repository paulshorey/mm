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
    const value = intervalValues[interval];
    if (value !== null && value !== undefined && !isNaN(value)) {
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
 *
 * @param row - Database row with interval columns
 * @returns Object with just the interval values
 */
export function extractIntervalValues(row: Record<string, any>): Record<StrengthInterval, number | null> {
  const values: Record<string, number | null> = {};

  for (const interval of STRENGTH_INTERVALS) {
    values[interval] = row[interval] ?? null;
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

