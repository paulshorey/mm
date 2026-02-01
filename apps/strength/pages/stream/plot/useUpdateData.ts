import { useCallback } from 'react'
import type { CandleTuple } from '@/lib/market-data/candles'
import { RSI_PERIOD } from './constants'
import {
  candlesToPriceOhlc,
  candlesToCvdOhlc,
  candlesToEvrOhlc,
  candlesToVwapOhlc,
  candlesToSpreadBpsOhlc,
  candlesToPricePctOhlc,
  candlesToBookImbalance,
  candlesToVolume,
  candlesToBigTrades,
  candlesToBigVolume,
  candlesToVdStrength,
} from './formatting'
import { calculateRSI } from '../lib/indicators'
import type { SeriesRefs, AbsorptionRefs } from './useChart'

interface UseUpdateDataProps {
  seriesRefs: SeriesRefs
  absorptionRefs: AbsorptionRefs
}

interface UseUpdateDataReturn {
  updateChartData: (candles: CandleTuple[]) => void
}

export function useUpdateData({
  seriesRefs,
  absorptionRefs,
}: UseUpdateDataProps): UseUpdateDataReturn {
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
          candlesToBookImbalance(candles)
        )
      }
      if (seriesRefs.volume.current) {
        seriesRefs.volume.current.setData(candlesToVolume(candles))
      }
      if (seriesRefs.bigTrades.current) {
        seriesRefs.bigTrades.current.setData(candlesToBigTrades(candles))
      }
      if (seriesRefs.bigVolume.current) {
        seriesRefs.bigVolume.current.setData(candlesToBigVolume(candles))
      }
      if (seriesRefs.vdStrength.current) {
        seriesRefs.vdStrength.current.setData(candlesToVdStrength(candles))
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

  return { updateChartData }
}
