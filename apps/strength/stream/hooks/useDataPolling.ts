import { useCallback, useRef } from 'react'
import { Time } from 'lightweight-charts'
import { VerticalLinePrimitive } from '../../tradingview/lib/primitives/VerticalLinePrimitive'
import type { CandleTuple } from '@/lib/market-data/candles'
import {
  IDX,
  POLL_INTERVAL_MS,
  RECENT_CANDLES,
  RSI_PERIOD,
  ABSORPTION_MARKER,
  buildCandlesUrl,
} from '../lib/constants'
import {
  candlesToPriceOhlc,
  candlesToCvdOhlc,
  candlesToEvrOhlc,
  candlesToVwapOhlc,
  candlesToSpreadBpsOhlc,
  candlesToPricePctOhlc,
  candlesToBookImbalanceData,
  candlesToVolumeData,
  candlesToBigTradesData,
  candlesToBigVolumeData,
  candlesToVdStrengthData,
} from '../lib/dataTransformers'
import { calculateRSI, detectAbsorptionPoints } from '../lib/indicators'
import type { SeriesRefs, AbsorptionRefs } from './useChartSetup'

interface UseDataPollingProps {
  dataRef: React.MutableRefObject<CandleTuple[]>
  seriesRefs: SeriesRefs
  absorptionRefs: AbsorptionRefs
}

interface UseDataPollingReturn {
  fetchCandles: (limit: number) => Promise<CandleTuple[]>
  updateChartData: (candles: CandleTuple[]) => void
  applyRecentCandles: (recentCandles: CandleTuple[]) => void
  startPolling: () => void
  stopPolling: () => void
}

export function useDataPolling({
  dataRef,
  seriesRefs,
  absorptionRefs,
}: UseDataPollingProps): UseDataPollingReturn {
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const hasStartedPollingRef = useRef(false)

  const fetchCandles = useCallback(async (limit: number) => {
    const response = await fetch(buildCandlesUrl(limit))
    if (!response.ok) {
      throw new Error(`Failed to fetch candles: ${response.status}`)
    }
    return (await response.json()) as CandleTuple[]
  }, [])

  const updateChartData = useCallback(
    (candles: CandleTuple[]) => {
      // Update price series
      if (seriesRefs.price.current) {
        seriesRefs.price.current.setData(candlesToPriceOhlc(candles))
      }

      // Update CVD series (OHLC bars)
      if (seriesRefs.cvd.current) {
        seriesRefs.cvd.current.setData(candlesToCvdOhlc(candles))
      }

      // Update RSI
      if (seriesRefs.rsi.current) {
        seriesRefs.rsi.current.setData(calculateRSI(candles, RSI_PERIOD))
      }

      // Update OHLC bar series
      if (seriesRefs.evr.current) {
        seriesRefs.evr.current.setData(candlesToEvrOhlc(candles))
      }
      if (seriesRefs.vwap.current) {
        seriesRefs.vwap.current.setData(candlesToVwapOhlc(candles))
      }
      if (seriesRefs.spreadBps.current) {
        seriesRefs.spreadBps.current.setData(candlesToSpreadBpsOhlc(candles))
      }
      if (seriesRefs.pricePct.current) {
        seriesRefs.pricePct.current.setData(candlesToPricePctOhlc(candles))
      }

      // Update line series
      if (seriesRefs.bookImbalance.current) {
        seriesRefs.bookImbalance.current.setData(
          candlesToBookImbalanceData(candles)
        )
      }
      if (seriesRefs.volume.current) {
        seriesRefs.volume.current.setData(candlesToVolumeData(candles))
      }
      if (seriesRefs.bigTrades.current) {
        seriesRefs.bigTrades.current.setData(candlesToBigTradesData(candles))
      }
      if (seriesRefs.bigVolume.current) {
        seriesRefs.bigVolume.current.setData(candlesToBigVolumeData(candles))
      }
      if (seriesRefs.vdStrength.current) {
        seriesRefs.vdStrength.current.setData(candlesToVdStrengthData(candles))
      }

      // Temporarily disable absorption markers:
      // // Update absorption markers
      // if (seriesRefs.price.current) {
      //   const absorptionTimestamps = detectAbsorptionPoints(candles)
      //   // Add markers for new absorption points (avoid duplicates)
      //   for (const timestamp of absorptionTimestamps) {
      //     if (!absorptionRefs.timestamps.current.has(timestamp)) {
      //       const marker = new VerticalLinePrimitive(
      //         (timestamp / 1000) as Time,
      //         ABSORPTION_MARKER
      //       )
      //       seriesRefs.price.current.attachPrimitive(marker)
      //       absorptionRefs.markers.current.push(marker)
      //       absorptionRefs.timestamps.current.add(timestamp)
      //     }
      //   }
      // }
    },
    [seriesRefs, absorptionRefs]
  )

  const applyRecentCandles = useCallback(
    (recentCandles: CandleTuple[]) => {
      const existing = dataRef.current
      if (existing.length === 0) {
        dataRef.current = recentCandles
        updateChartData(recentCandles)
        return
      }

      // Create index for fast lookup of existing candles by timestamp
      const startIndex = Math.max(0, existing.length - recentCandles.length - 2)
      const indexByTime = new Map<number, number>()
      for (let i = startIndex; i < existing.length; i += 1) {
        const candle = existing[i]
        if (!candle) continue
        indexByTime.set(candle[IDX.TIMESTAMP], i)
      }

      let didUpdate = false

      for (const candle of recentCandles) {
        const existingIndex = indexByTime.get(candle[IDX.TIMESTAMP])
        if (existingIndex !== undefined) {
          const existingCandle = existing[existingIndex]
          if (
            existingCandle &&
            existingCandle[IDX.CLOSE] !== candle[IDX.CLOSE]
          ) {
            existing[existingIndex] = candle
            didUpdate = true
          }
          continue
        }

        const lastExisting = existing[existing.length - 1]
        if (
          lastExisting &&
          candle[IDX.TIMESTAMP] > lastExisting[IDX.TIMESTAMP]
        ) {
          existing.push(candle)
          didUpdate = true
        }
      }

      if (didUpdate) {
        updateChartData(existing)
      }
    },
    [dataRef, updateChartData]
  )

  const pollLatest = useCallback(async () => {
    if (isPollingRef.current) return
    isPollingRef.current = true
    try {
      const recentCandles = await fetchCandles(RECENT_CANDLES)
      if (recentCandles.length > 0) {
        applyRecentCandles(recentCandles)
      }
    } catch (err) {
      console.error('Error fetching recent candles:', err)
    } finally {
      isPollingRef.current = false
    }
  }, [applyRecentCandles, fetchCandles])

  const startPolling = useCallback(() => {
    if (hasStartedPollingRef.current) return
    hasStartedPollingRef.current = true

    if (pollRef.current) {
      clearInterval(pollRef.current)
    }
    pollRef.current = setInterval(() => {
      void pollLatest()
    }, POLL_INTERVAL_MS)
  }, [pollLatest])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    hasStartedPollingRef.current = false
  }, [])

  return {
    fetchCandles,
    updateChartData,
    applyRecentCandles,
    startPolling,
    stopPolling,
  }
}
