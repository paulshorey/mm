import { BarData, LineData, Time } from 'lightweight-charts'
import type { CandleTuple } from '@/lib/market-data/candles'
import { IDX } from './constants'

/**
 * Convert candles to BarData format for price OHLC bars
 */
export function candlesToPriceOhlc(candles: CandleTuple[]): BarData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    open: candle[IDX.OPEN],
    high: candle[IDX.HIGH],
    low: candle[IDX.LOW],
    close: candle[IDX.CLOSE],
  }))
}

/**
 * Convert candles to BarData format for CVD OHLC bars
 * Values are inverted (negated) for display
 */
export function candlesToCvdOhlc(candles: CandleTuple[]): BarData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    open: -candle[IDX.CVD_OPEN],
    high: -candle[IDX.CVD_LOW], // Inverted: low becomes high
    low: -candle[IDX.CVD_HIGH], // Inverted: high becomes low
    close: -candle[IDX.CVD_CLOSE],
  }))
}

/**
 * Convert candles to BarData format for EVR OHLC bars
 * Values are multiplied by 8 to match the scale of pricePct
 */
export function candlesToEvrOhlc(candles: CandleTuple[]): BarData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    open: candle[IDX.EVR_OPEN] * 7,
    high: candle[IDX.EVR_HIGH] * 7,
    low: candle[IDX.EVR_LOW] * 7,
    close: candle[IDX.EVR_CLOSE] * 7,
  }))
}

/**
 * Convert candles to BarData format for VWAP OHLC bars
 * Filters out candles with missing VWAP data (0 or null) to avoid skewing the scale
 */
export function candlesToVwapOhlc(candles: CandleTuple[]): BarData[] {
  return candles
    .filter(
      (candle) =>
        candle[IDX.VWAP_OPEN] &&
        candle[IDX.VWAP_HIGH] &&
        candle[IDX.VWAP_LOW] &&
        candle[IDX.VWAP_CLOSE]
    )
    .map((candle) => ({
      time: (candle[IDX.TIMESTAMP] / 1000) as Time,
      open: candle[IDX.VWAP_OPEN],
      high: candle[IDX.VWAP_HIGH],
      low: candle[IDX.VWAP_LOW],
      close: candle[IDX.VWAP_CLOSE],
    }))
}

function normalizeSpreadBps(spreadBps: number): number {
  return Math.min(1, Math.max(-1, spreadBps * 10))
}
/**
 * Convert candles to BarData format for SPREAD_BPS OHLC bars
 */
export function candlesToSpreadBpsOhlc(candles: CandleTuple[]): BarData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    open: normalizeSpreadBps(candle[IDX.SPREAD_BPS_OPEN]),
    high: normalizeSpreadBps(candle[IDX.SPREAD_BPS_HIGH]),
    low: normalizeSpreadBps(candle[IDX.SPREAD_BPS_LOW]),
    close: normalizeSpreadBps(candle[IDX.SPREAD_BPS_CLOSE]),
  }))
}

/**
 * Convert candles to BarData format for PRICE_PCT OHLC bars
 */
export function candlesToPricePctOhlc(candles: CandleTuple[]): BarData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    open: candle[IDX.PRICE_PCT_OPEN],
    high: candle[IDX.PRICE_PCT_HIGH],
    low: candle[IDX.PRICE_PCT_LOW],
    close: candle[IDX.PRICE_PCT_CLOSE],
  }))
}

/**
 * Convert candles to LineData format for book_imbalance_close
 * Values are inverted (negated) for display
 */
export function candlesToBookImbalanceData(candles: CandleTuple[]): LineData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    value: candle[IDX.BOOK_IMBALANCE_CLOSE],
  }))
}

/**
 * Convert candles to LineData format for big_trades
 */
export function candlesToBigTradesData(candles: CandleTuple[]): LineData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    value: candle[IDX.BIG_TRADES],
  }))
}

/**
 * Convert candles to LineData format for big_volume
 */
export function candlesToBigVolumeData(candles: CandleTuple[]): LineData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    value: candle[IDX.BIG_VOLUME],
  }))
}

/**
 * Convert candles to LineData format for volume
 */
export function candlesToVolumeData(candles: CandleTuple[]): LineData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    value: candle[IDX.VOLUME],
  }))
}

/**
 * Convert candles to LineData format for vd_strength
 */
export function candlesToVdStrengthData(candles: CandleTuple[]): LineData[] {
  return candles.map((candle) => ({
    time: (candle[IDX.TIMESTAMP] / 1000) as Time,
    value: candle[IDX.VD_STRENGTH],
  }))
}
