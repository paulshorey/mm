'use client'

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  createChart,
  IChartApi,
  LineData,
  LineSeries,
  ISeriesApi,
  Time,
  IPriceLine,
} from 'lightweight-charts'
import { getChartConfig, getLineSeriesConfig } from '../lib/chartConfig'
import ChartTitle from './ChartTitle'
import { NoDataState } from './ChartStates'
import classes from '../classes.module.scss'
import { MultipleStrengthSeries } from '../lib/aggregateStrengthData'

interface ChartProps {
  heading: string | React.ReactNode
  name: string
  strengthData: MultipleStrengthSeries | null
  priceData?: LineData[] | null
  width: number
  height: number
  timeRange?: { from: Time; to: Time } | null
  showZeroLine?: boolean
}

export interface ChartRef {
  chart: IChartApi | null
  intervalSeries: Map<string, ISeriesApi<'Line'>> | null
  averageSeries: ISeriesApi<'Line'> | null
  priceSeries?: ISeriesApi<'Line'> | null
  container: HTMLDivElement | null
}

export const Chart = forwardRef<ChartRef, ChartProps>(
  (
    {
      heading,
      name,
      strengthData,
      priceData,
      width,
      height,
      timeRange,
      showZeroLine,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const intervalSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
    const averageSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
    const priceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
    const zeroLineRef = useRef<IPriceLine | null>(null)
    const hasInitialized = useRef(false)
    const lastAverageDataRef = useRef<LineData[] | null>(null)
    const lastIntervalDataRef = useRef<Map<string, LineData[]>>(new Map())
    const lastSecondDataRef = useRef<LineData[] | null>(null)

    useImperativeHandle(ref, () => ({
      chart: chartRef.current,
      intervalSeries: intervalSeriesRef.current,
      averageSeries: averageSeriesRef.current,
      priceSeries: priceSeriesRef.current,
      container: containerRef.current,
    }))

    // Create chart only once on mount
    useEffect(() => {
      if (!containerRef.current || hasInitialized.current) return

      // Create chart
      const chart = createChart(containerRef.current, getChartConfig(height))
      chartRef.current = chart
      hasInitialized.current = true

      // Add average series (strength) - uses LEFT price scale, full opacity
      const averageSeries = chart.addSeries(LineSeries, {
        ...getLineSeriesConfig(),
        color: '#ff9d00', // Full opacity for average (bright and prominent)
        priceScaleId: 'left',
      })
      averageSeriesRef.current = averageSeries

      // Add price series - uses RIGHT price scale (default)
      // Always create the series, even if data doesn't exist yet
      const priceSeries = chart.addSeries(LineSeries, {
        ...getLineSeriesConfig(),
        color: '#0091ff98',
        priceScaleId: 'right',
      })
      priceSeriesRef.current = priceSeries

      // Set initial data if available
      if (strengthData) {
        // Set average data
        if (strengthData.averageSeries.length > 0) {
          averageSeries.setData(strengthData.averageSeries)
        }

        // Create series for each interval (20% opacity - very light)
        strengthData.intervalSeries.forEach(({ interval, data }) => {
          const intervalSeries = chart.addSeries(LineSeries, {
            ...getLineSeriesConfig(),
            color: '#ff9d0033', // 20% opacity for individual intervals (very light)
            priceScaleId: 'left',
          })
          intervalSeriesRef.current.set(interval, intervalSeries)
          if (data.length > 0) {
            intervalSeries.setData(data)
          }
        })
      }

      if (priceData && priceSeriesRef.current) {
        priceSeriesRef.current.setData(priceData)
      }

      // Apply initial time range if provided
      if (timeRange && timeRange.from < timeRange.to) {
        try {
          chart.timeScale().setVisibleRange(timeRange)
        } catch (error) {
          console.warn('Failed to set initial visible range:', error)
        }
      }

      // Cleanup
      return () => {
        chart.remove()
        chartRef.current = null
        averageSeriesRef.current = null
        intervalSeriesRef.current.clear()
        priceSeriesRef.current = null
        zeroLineRef.current = null
        hasInitialized.current = false
      }
    }, []) // Only run once on mount - removed all dependencies

    // Update average series data
    useEffect(() => {
      if (
        !averageSeriesRef.current ||
        !strengthData ||
        !hasInitialized.current
      )
        return

      try {
        const prevData = lastAverageDataRef.current
        const currentData = strengthData.averageSeries

        // Check if data actually changed
        const dataChanged =
          !prevData ||
          prevData.length !== currentData.length ||
          prevData.some((item, index) => {
            const currentItem = currentData[index]
            return (
              !currentItem ||
              item.time !== currentItem.time ||
              Math.abs(item.value - currentItem.value) > 0.0001
            )
          })

        if (!dataChanged) {
          console.warn(
            `[Chart] No data change detected for ${name} (average), skipping update`
          )
          return
        }

        // Simply use setData for all updates
        averageSeriesRef.current.setData(currentData)
        lastAverageDataRef.current = [...currentData]

        // Reapply time range after data update
        if (timeRange && chartRef.current && timeRange.from < timeRange.to) {
          setTimeout(() => {
            if (
              chartRef.current &&
              timeRange &&
              timeRange.from < timeRange.to
            ) {
              try {
                chartRef.current.timeScale().setVisibleRange(timeRange)
              } catch (error) {
                console.warn(
                  'Failed to set visible range after data update:',
                  error
                )
              }
            }
          }, 100)
        }
      } catch (error) {
        console.warn('Failed to update average strength data:', error)
      }
    }, [strengthData, timeRange, name])

    // Update interval series data
    useEffect(() => {
      if (!strengthData || !hasInitialized.current || !chartRef.current) return

      try {
        const currentIntervals = new Set(
          strengthData.intervalSeries.map((s) => s.interval)
        )
        const existingIntervals = new Set(intervalSeriesRef.current.keys())

        // Remove series for intervals that are no longer selected
        existingIntervals.forEach((interval) => {
          if (!currentIntervals.has(interval)) {
            const series = intervalSeriesRef.current.get(interval)
            if (series && chartRef.current) {
              chartRef.current.removeSeries(series)
              intervalSeriesRef.current.delete(interval)
              lastIntervalDataRef.current.delete(interval)
            }
          }
        })

        // Add or update series for each interval
        strengthData.intervalSeries.forEach(({ interval, data }) => {
          const prevData = lastIntervalDataRef.current.get(interval)

          // Check if data actually changed
          const dataChanged =
            !prevData ||
            prevData.length !== data.length ||
            prevData.some((item, index) => {
              const currentItem = data[index]
              return (
                !currentItem ||
                item.time !== currentItem.time ||
                Math.abs(item.value - currentItem.value) > 0.0001
              )
            })

          if (!dataChanged) {
            return // Skip update if no change
          }

          // Get or create series for this interval
          let series = intervalSeriesRef.current.get(interval)
          if (!series && chartRef.current) {
            // Create new series
            series = chartRef.current.addSeries(LineSeries, {
              ...getLineSeriesConfig(),
              color: '#ff9d0033', // 20% opacity for individual intervals (very light)
              priceScaleId: 'left',
            })
            intervalSeriesRef.current.set(interval, series)
          }

          // Update data
          if (series && data.length > 0) {
            series.setData(data)
            lastIntervalDataRef.current.set(interval, [...data])
          }
        })
      } catch (error) {
        console.warn('Failed to update interval strength data:', error)
      }
    }, [strengthData, name])

    // Update second series (price) data
    useEffect(() => {
      if (!priceSeriesRef.current || !priceData || !hasInitialized.current)
        return

      try {
        const prevData = lastSecondDataRef.current
        const currentData = priceData

        // Check if data actually changed
        const dataChanged =
          !prevData ||
          prevData.length !== currentData.length ||
          prevData.some((item, index) => {
            const currentItem = currentData[index]
            return (
              !currentItem ||
              item.time !== currentItem.time ||
              Math.abs(item.value - currentItem.value) > 0.0001
            )
          })

        if (!dataChanged) {
          console.warn(
            `[Chart] No data change detected for ${name} (price), skipping update`
          )
          return
        }

        // Simply use setData for all updates
        priceSeriesRef.current.setData(currentData)
        lastSecondDataRef.current = [...currentData]
      } catch (error) {
        console.warn('Failed to update price data:', error)
      }
    }, [priceData, name])

    // Update chart dimensions when they change
    useEffect(() => {
      if (!chartRef.current || !hasInitialized.current) return

      chartRef.current.applyOptions({
        width,
        height,
      })
    }, [width, height])

    // Update time range when it changes
    useEffect(() => {
      if (!chartRef.current || !timeRange || !hasInitialized.current) return

      // Validate time range before setting
      if (timeRange.from >= timeRange.to) {
        console.warn('Invalid time range: from >= to', timeRange)
        return
      }

      try {
        chartRef.current.timeScale().setVisibleRange(timeRange)
      } catch (error) {
        console.warn('Failed to set visible range:', error)
      }
    }, [timeRange])

    // Handle showZeroLine changes
    useEffect(() => {
      if (!averageSeriesRef.current || !hasInitialized.current) return

      // Remove existing zero line if it exists
      if (zeroLineRef.current) {
        averageSeriesRef.current.removePriceLine(zeroLineRef.current)
        zeroLineRef.current = null
      }

      // Add zero line if requested
      if (showZeroLine) {
        const zeroLine = averageSeriesRef.current.createPriceLine({
          price: 0,
          color: '#666666',
          lineWidth: 1,
          lineStyle: 2, // Dashed line
          axisLabelVisible: false,
          title: '',
        })
        zeroLineRef.current = zeroLine
      }
    }, [showZeroLine])

    const hasData =
      strengthData !== null && strengthData.averageSeries.length > 0

    return (
      <div
        key={name}
        id={`chart-${name}`}
        className={classes.Chart}
        style={{
          width: width + 'px',
        }}
      >
        {/* Chart container */}
        <div
          ref={containerRef}
          className={`border border-gray-200 rounded z-10 pr-[10px]`}
        />

        {/* Title floating at top left of chart */}
        <ChartTitle heading={heading} hasData={hasData}>
          <NoDataState />
        </ChartTitle>
      </div>
    )
  }
)

Chart.displayName = 'Chart'
