/**
 * useStrengthData - Controlled data fetching hook with state machine
 *
 * Provides a clean, predictable flow for fetching and updating strength data:
 * 1. IDLE - No tickers selected
 * 2. LOADING - Fetching historical data (real-time paused)
 * 3. READY - Data ready, real-time updates active
 *
 * When tickers change:
 * - Pauses real-time updates
 * - Clears all data
 * - Fetches new historical data
 * - Resumes real-time updates
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { StrengthRowGet } from '@lib/common/sql/strength'
import { FetchStrengthData } from './FetchStrengthData'
import { HOURS_BACK_INITIAL } from '../../constants'
import { strengthIntervals } from '../../state/useChartControlsStore'

export type DataState = 'idle' | 'loading' | 'ready'

export interface UseStrengthDataOptions {
  tickers: string[]
  enabled?: boolean
  maxDataHours?: number
  updateIntervalMs?: number
}

export interface UseStrengthDataResult {
  rawData: (StrengthRowGet[] | null)[]
  dataState: DataState
  error: string | null
  lastUpdateTime: Date | null
  /** Key that changes when tickers change - use for chart reset */
  dataVersion: number
}

/**
 * Forward-fill missing strength values from previous row
 */
function forwardFillRow(
  currentRow: StrengthRowGet,
  previousRow: StrengthRowGet
): StrengthRowGet {
  const filled = { ...currentRow }

  strengthIntervals.forEach((interval) => {
    if (filled[interval] === null && previousRow[interval] !== null) {
      filled[interval] = previousRow[interval]
    }
  })

  if (filled.price === 0 || filled.price === null) {
    filled.price = previousRow.price || 0
  }

  return filled
}

export function useStrengthData({
  tickers,
  enabled = true,
  maxDataHours = HOURS_BACK_INITIAL,
  updateIntervalMs = 10000,
}: UseStrengthDataOptions): UseStrengthDataResult {
  const [rawData, setRawData] = useState<(StrengthRowGet[] | null)[]>([])
  const [dataState, setDataState] = useState<DataState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  // Refs for tracking state
  const isMountedRef = useRef(true)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentTickersRef = useRef<string[]>([])
  const lastDataTimestampRef = useRef<Date | null>(null)

  /**
   * Stop real-time updates
   */
  const stopRealtimeUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
  }, [])

  /**
   * Fetch real-time update (last few minutes of data)
   */
  const fetchRealtimeUpdate = useCallback(async () => {
    if (!isMountedRef.current || currentTickersRef.current.length === 0) return

    try {
      const now = new Date()
      const fromDate = new Date(now.getTime() - 4 * 60 * 1000)
      const toDate = new Date()

      const newTickerData = await FetchStrengthData.fetchMultipleTickersData(
        currentTickersRef.current,
        fromDate,
        toDate
      )

      // Process and forward-fill
      const processedData = newTickerData.map((tickerData) => {
        if (!tickerData || tickerData.length === 0) return tickerData

        const sorted = [...tickerData].sort(
          (a, b) => a.timenow.getTime() - b.timenow.getTime()
        )

        const filled: StrengthRowGet[] = []
        for (let i = 0; i < sorted.length; i++) {
          if (i === 0) {
            filled.push(sorted[i]!)
          } else {
            filled.push(forwardFillRow(sorted[i]!, sorted[i - 1]!))
          }
        }
        return filled
      })

      if (isMountedRef.current) {
        setRawData((prevData) => {
          let newLatestTimestamp = lastDataTimestampRef.current

          const mergedData = prevData.map((existing, idx) => {
            const newData = processedData[idx]
            if (!newData || newData.length === 0) return existing
            if (!existing) return newData

            const merged = FetchStrengthData.mergeData(existing, newData)

            if (merged.length > 0) {
              const last = merged[merged.length - 1]
              if (last && (!newLatestTimestamp || last.timenow > newLatestTimestamp)) {
                newLatestTimestamp = last.timenow
              }
            }

            return merged
          })

          lastDataTimestampRef.current = newLatestTimestamp
          return mergedData
        })

        setLastUpdateTime(new Date())
      }
    } catch (err) {
      console.error('Real-time update error:', err)
      // Don't set error state - keep showing existing data
    }
  }, [])

  /**
   * Start real-time updates
   */
  const startRealtimeUpdates = useCallback(() => {
    stopRealtimeUpdates()

    updateIntervalRef.current = setInterval(() => {
      fetchRealtimeUpdate()
    }, updateIntervalMs)
  }, [stopRealtimeUpdates, fetchRealtimeUpdate, updateIntervalMs])

  /**
   * Load historical data for tickers
   */
  const loadHistoricalData = useCallback(
    async (tickersToLoad: string[]) => {
      if (tickersToLoad.length === 0) {
        setDataState('idle')
        setRawData([])
        return
      }

      // Stop any real-time updates
      stopRealtimeUpdates()

      // Clear existing data and set loading state
      setRawData([])
      setError(null)
      setDataState('loading')
      setDataVersion((v) => v + 1)
      lastDataTimestampRef.current = null

      try {
        const initialDate = FetchStrengthData.getInitialDataDate(maxDataHours)
        const allTickerData = await FetchStrengthData.fetchMultipleTickersData(
          tickersToLoad,
          initialDate
        )

        if (!isMountedRef.current) return

        // Check if tickers changed while loading
        if (
          tickersToLoad.length !== currentTickersRef.current.length ||
          tickersToLoad.some((t, i) => t !== currentTickersRef.current[i])
        ) {
          // Tickers changed during fetch - abort, new fetch will be triggered
          return
        }

        // Find latest timestamp
        let latestTimestamp: Date | null = null
        allTickerData.forEach((tickerData) => {
          if (tickerData && tickerData.length > 0) {
            const last = tickerData[tickerData.length - 1]
            if (last && (!latestTimestamp || last.timenow > latestTimestamp)) {
              latestTimestamp = last.timenow
            }
          }
        })

        setRawData(allTickerData)
        lastDataTimestampRef.current = latestTimestamp
        setLastUpdateTime(new Date())
        setDataState('ready')

        // Start real-time updates
        startRealtimeUpdates()
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error loading historical data:', err)
          setError(err instanceof Error ? err.message : 'Failed to load data')
          setDataState('idle')
        }
      }
    },
    [maxDataHours, stopRealtimeUpdates, startRealtimeUpdates]
  )

  /**
   * Effect: Handle ticker changes
   * This is the main orchestrator - when tickers change, it kicks off the loading process
   */
  useEffect(() => {
    if (!enabled) {
      stopRealtimeUpdates()
      setDataState('idle')
      setRawData([])
      currentTickersRef.current = []
      return
    }

    // Check if tickers actually changed
    const tickersChanged =
      tickers.length !== currentTickersRef.current.length ||
      tickers.some((t, i) => t !== currentTickersRef.current[i])

    if (tickersChanged) {
      currentTickersRef.current = [...tickers]
      loadHistoricalData(tickers)
    }
  }, [tickers, enabled, loadHistoricalData, stopRealtimeUpdates])

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      stopRealtimeUpdates()
    }
  }, [stopRealtimeUpdates])

  return {
    rawData,
    dataState,
    error,
    lastUpdateTime,
    dataVersion,
  }
}

