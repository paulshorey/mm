'use client'

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useStrengthData } from './lib/data/useStrengthData'
import { calculateTimeRange } from './lib/chartUtils'
import { Chart, ChartRef } from './components/Chart'
import { LoadingState, ErrorState } from './components/ChartStates'
import { UpdatedTime } from './components/UpdatedTime'
import { useChartControlsStore } from './state/useChartControlsStore'
import { COLORS, HOURS_BACK_INITIAL } from './constants'
import {
  useAggregationWorker,
  AggregationResult,
} from './lib/workers/useAggregationWorker'
import { SCALE_FACTOR } from '@/constants'
import { LineData, Time } from 'lightweight-charts'

export interface SyncedChartsProps {
  availableHeight: number
  availableHeightCrop: number
}

/**
 * SyncedCharts - Main chart component with controlled data flow
 *
 * Data Flow:
 * 1. User selects tickers → dataState = 'loading'
 * 2. Historical data fetched → send to worker
 * 3. Worker returns aggregated data → render chart
 * 4. Real-time updates poll every 10s → incremental worker updates
 *
 * When tickers change:
 * - Real-time updates paused automatically by useStrengthData
 * - Chart data cleared
 * - New data fetched and processed
 * - Chart re-rendered with new data
 */
export function SyncedCharts({ availableHeight }: SyncedChartsProps) {
  const chartRef = useRef<ChartRef | null>(null)

  // Zustand store
  const {
    hoursBack,
    interval,
    chartTickers,
    timeRange,
    aggregatedStrengthData,
    aggregatedPriceData,
    intervalStrengthData,
    tickerPriceData,
    showIntervalLines,
    showTickerLines,
    setTimeRange,
    setAggregatedStrengthData,
    setAggregatedPriceData,
    setIntervalStrengthData,
    setTickerPriceData,
  } = useChartControlsStore()

  // Local state for chart rendering control
  const [chartData, setChartData] = useState<{
    strength: LineData<Time>[] | null
    price: LineData<Time>[] | null
    intervalStrength: Record<string, LineData<Time>[]>
    tickerPrice: Record<string, LineData<Time>[]>
  }>({
    strength: null,
    price: null,
    intervalStrength: {},
    tickerPrice: {},
  })
  const [isChartReady, setIsChartReady] = useState(false)

  /**
   * Controlled data fetching hook
   * Handles ticker changes, loading state, and real-time updates
   */
  const { rawData, dataState, error, lastUpdateTime, dataVersion } =
    useStrengthData({
      tickers: chartTickers,
      enabled: chartTickers.length > 0,
      maxDataHours: HOURS_BACK_INITIAL,
      updateIntervalMs: 10000,
    })

  /**
   * Handle aggregation results from the Web Worker
   */
  const handleAggregationResult = useCallback(
    (
      result: AggregationResult,
      processingTimeMs: number,
      requestId: number
    ) => {
      // Update local chart data (not the store - for immediate rendering)
      setChartData({
        strength: result.strengthData,
        price: result.priceData,
        intervalStrength: result.intervalStrengthData,
        tickerPrice: result.tickerPriceData,
      })

      // Also update store for any external consumers
      setAggregatedStrengthData(result.strengthData)
      setAggregatedPriceData(result.priceData)
      setIntervalStrengthData(result.intervalStrengthData)
      setTickerPriceData(result.tickerPriceData)

      // Mark chart as ready to render
      setIsChartReady(true)

      if (processingTimeMs > 100) {
        console.log(
          `[Worker] Aggregation #${requestId} completed in ${processingTimeMs.toFixed(1)}ms`
        )
      }
    },
    [
      setAggregatedStrengthData,
      setAggregatedPriceData,
      setIntervalStrengthData,
      setTickerPriceData,
    ]
  )

  const handleAggregationError = useCallback((errorMsg: string) => {
    console.error('[Worker] Aggregation error:', errorMsg)
  }, [])

  /**
   * Web Worker for aggregation
   */
  const { aggregate, isProcessing, isReady, cancelPending } =
    useAggregationWorker({
      enabled: true,
      onResult: handleAggregationResult,
      onError: handleAggregationError,
    })

  /**
   * Effect: Clear chart when dataVersion changes (ticker switch)
   * This ensures old data is never shown during the transition
   */
  useEffect(() => {
    // Cancel any pending worker requests
    cancelPending()

    // Clear chart data immediately
    setChartData({
      strength: null,
      price: null,
      intervalStrength: {},
      tickerPrice: {},
    })
    setIsChartReady(false)

    // Clear store data
    setAggregatedStrengthData(null)
    setAggregatedPriceData(null)
    setIntervalStrengthData({})
    setTickerPriceData({})
  }, [
    dataVersion,
    cancelPending,
    setAggregatedStrengthData,
    setAggregatedPriceData,
    setIntervalStrengthData,
    setTickerPriceData,
  ])

  /**
   * Effect: Process data through worker when rawData changes
   * Only triggers when we have actual data and worker is ready
   */
  useEffect(() => {
    // Don't process if still loading or no data
    if (dataState !== 'ready') return
    if (rawData.length === 0 || !rawData.some((data) => data !== null)) return
    if (!isReady) return

    // Don't queue up requests if already processing
    if (isProcessing) return

    // Send to worker for aggregation
    aggregate(rawData, interval, chartTickers)
  }, [
    rawData,
    dataState,
    interval,
    chartTickers,
    isReady,
    isProcessing,
    aggregate,
  ])

  /**
   * Effect: Calculate time range when data is ready
   * Only calculates when we have aggregated data ready to display
   */
  useEffect(() => {
    if (!isChartReady || !chartData.strength || chartData.strength.length === 0)
      return

    const newRange = calculateTimeRange(rawData, parseInt(hoursBack))
    if (newRange && newRange.from < newRange.to) {
      setTimeRange(newRange)
    }
  }, [hoursBack, rawData, isChartReady, chartData.strength, setTimeRange])

  /**
   * Determine what to render based on state
   */
  const showLoading = dataState === 'loading'
  const showError = error && dataState !== 'loading'
  const showChart =
    dataState === 'ready' && isChartReady && chartData.strength !== null

  // Only pass timeRange to chart when data is ready
  const chartTimeRange = showChart ? timeRange : undefined

  return (
    <div className="relative w-full">
      {/* Loading state - shown while fetching historical data */}
      {showLoading && <LoadingState />}

      {/* Error state */}
      {showError && <ErrorState error={error} />}

      {/* Chart - only rendered when data is ready */}
      {showChart && (
        <Chart
          key={`chart-${dataVersion}`}
          ref={(el) => {
            chartRef.current = el
          }}
          name="Strength & Price"
          heading={
            <span
              className="flex flex-row pl-[5px] scale2x"
              style={{ transformOrigin: 'left bottom' }}
            >
              <span className="pt-1 pr-1 pl-1 opacity-90 text-sm">
                <span
                  style={{
                    color: COLORS.price,
                    textShadow: '1px 1px 1px rgba(255, 255, 255, 1)',
                  }}
                >
                  Price
                </span>
                <span style={{ color: COLORS.neutral }}> / </span>
                <span
                  style={{
                    color: COLORS.strength,
                    textShadow: '1px 1px 1px rgba(255, 255, 255, 1)',
                  }}
                >
                  Strength
                </span>
              </span>
            </span>
          }
          strengthData={chartData.strength}
          priceData={chartData.price}
          intervalStrengthData={chartData.intervalStrength}
          tickerPriceData={chartData.tickerPrice}
          tickers={chartTickers}
          showIntervalLines={showIntervalLines}
          showTickerLines={showTickerLines}
          width={
            typeof window !== 'undefined'
              ? window.innerWidth * SCALE_FACTOR
              : 1200
          }
          height={availableHeight}
          timeRange={chartTimeRange}
          showZeroLine={true}
        />
      )}

      {/* Last updated time */}
      <UpdatedTime
        isRealtime={dataState === 'ready'}
        lastUpdateTime={lastUpdateTime}
      />

      {/* Target box for screen capture */}
      <div
        id="screenshot-target"
        className="absolute top-[34px] left-0 right-[8px] bottom-[34px] pointer-events-none"
      />
    </div>
  )
}
