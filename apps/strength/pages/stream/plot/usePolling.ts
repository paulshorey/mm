import { useCallback, useRef } from 'react'
import type { CandleTuple } from '@/lib/market-data/candles'
import {
  IDX,
  POLL_INTERVAL_MS,
  RECENT_CANDLES,
  buildCandlesUrl,
} from './constants'
import { useUpdateData } from './useUpdateData'
import type { SeriesRefs, AbsorptionRefs } from './useChart'

interface UsePollingProps {
  dataRef: React.MutableRefObject<CandleTuple[]>
  seriesRefs: SeriesRefs
  absorptionRefs: AbsorptionRefs
}

interface UsePollingReturn {
  fetchCandles: (limit: number) => Promise<CandleTuple[]>
  updateChartData: (candles: CandleTuple[]) => void
  applyRecentCandles: (recentCandles: CandleTuple[]) => void
  startPolling: () => void
  stopPolling: () => void
}

export function usePolling({
  dataRef,
  seriesRefs,
  absorptionRefs,
}: UsePollingProps): UsePollingReturn {
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)
  const hasStartedPollingRef = useRef(false)

  const { updateChartData } = useUpdateData({ seriesRefs, absorptionRefs })

  const fetchCandles = useCallback(async (limit: number) => {
    const response = await fetch(buildCandlesUrl(limit))
    if (!response.ok) {
      throw new Error(`Failed to fetch candles: ${response.status}`)
    }
    return (await response.json()) as CandleTuple[]
  }, [])

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
