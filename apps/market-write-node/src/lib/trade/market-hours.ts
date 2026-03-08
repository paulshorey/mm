/**
 * Futures market-hours helpers shared by live and batch aggregation.
 *
 * The rolling candle windows should treat scheduled market closures as paused
 * time rather than as a gap that forces VWAP/CVD continuity to reset.
 */

export interface OpenBucketCollection {
  bucketTimes: number[];
  openBucketCount: number;
  exceeded: boolean;
}

/**
 * CME-style futures market hours in UTC:
 * - Mon-Thu: closed 22:00-22:59
 * - Fri: closed from 22:00 through the weekend
 * - Sat: closed all day
 * - Sun: opens at 23:00
 */
export function isFuturesMarketOpenAt(date: Date): boolean {
  const utcDay = date.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  const utcHour = date.getUTCHours();

  if (utcDay === 6) {
    return false;
  }

  if (utcDay === 0 && utcHour < 23) {
    return false;
  }

  if (utcDay === 5 && utcHour >= 22) {
    return false;
  }

  if (utcHour === 22) {
    return false;
  }

  return true;
}

function getNextFuturesMarketOpenMs(currentMs: number): number {
  const date = new Date(currentMs);
  const utcDay = date.getUTCDay();
  const utcHour = date.getUTCHours();

  if (utcDay === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(23, 0, 0, 0);
    return date.getTime();
  }

  if (utcDay === 0 && utcHour < 23) {
    date.setUTCHours(23, 0, 0, 0);
    return date.getTime();
  }

  if (utcDay === 5 && utcHour >= 22) {
    date.setUTCDate(date.getUTCDate() + 2);
    date.setUTCHours(23, 0, 0, 0);
    return date.getTime();
  }

  if (utcHour === 22) {
    date.setUTCHours(23, 0, 0, 0);
    return date.getTime();
  }

  return currentMs;
}

/**
 * Collect missing open-market buckets between two timestamps.
 *
 * Closed-market spans are skipped entirely so scheduled daily/weekend closures
 * do not count against gap-reset limits.
 */
export function collectOpenBucketTimesBetween(
  startMsInclusive: number,
  endMsExclusive: number,
  stepMs: number,
  maxOpenBuckets: number,
): OpenBucketCollection {
  const bucketTimes: number[] = [];
  let openBucketCount = 0;
  let currentMs = startMsInclusive;

  while (currentMs < endMsExclusive) {
    if (!isFuturesMarketOpenAt(new Date(currentMs))) {
      const nextOpenMs = getNextFuturesMarketOpenMs(currentMs);
      currentMs = nextOpenMs > currentMs ? nextOpenMs : currentMs + stepMs;
      continue;
    }

    openBucketCount++;
    if (openBucketCount > maxOpenBuckets) {
      return {
        bucketTimes,
        openBucketCount,
        exceeded: true,
      };
    }

    bucketTimes.push(currentMs);
    currentMs += stepMs;
  }

  return {
    bucketTimes,
    openBucketCount,
    exceeded: false,
  };
}
