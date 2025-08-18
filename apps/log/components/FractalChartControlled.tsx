'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  IChartApi,
  LineData,
  LineSeries,
  Time,
  MouseEventParams,
  ISeriesApi,
} from 'lightweight-charts'
import { FractalData, parseFractalCSV } from '../lib/parseFractalCSV'

interface ChartConfig {
  fileName: string
  displayName: string
  description: string
}

interface FractalChartControlledProps {
  width?: number
  height?: number
}

// Configuration for all CSV files
const CHART_CONFIGS: ChartConfig[] = [
  {
    fileName: '/fractal/ETHUSD-30S.csv',
    displayName: 'ETH/USD 30-Second Chart',
    description: 'Very short term fractal analysis',
  },
  {
    fileName: '/fractal/ETHUSD-2.csv',
    displayName: 'ETH/USD 2-Minute Chart',
    description: 'Short term fractal analysis',
  },
  {
    fileName: '/fractal/ETHUSD-6.csv',
    displayName: 'ETH/USD 6-Minute Chart',
    description: 'Medium-short term fractal analysis',
  },
  {
    fileName: '/fractal/ETHUSD-8.csv',
    displayName: 'ETH/USD 8-Minute Chart',
    description: 'Medium term fractal analysis',
  },
  {
    fileName: '/fractal/ETHUSD-30.csv',
    displayName: 'ETH/USD 30-Minute Chart',
    description: 'Medium-long term fractal analysis',
  },
  {
    fileName: '/fractal/ETHUSD-90.csv',
    displayName: 'ETH/USD 90-Minute Chart',
    description: 'Long term fractal analysis',
  },
]

export default function FractalChartControlled({
  width = 800,
  height = 400,
}: FractalChartControlledProps) {
  const chartRefs = useRef<(IChartApi | null)[]>([])
  const chartContainerRefs = useRef<(HTMLDivElement | null)[]>([])
  const [loadingStates, setLoadingStates] = useState<boolean[]>(
    new Array(CHART_CONFIGS.length).fill(true)
  )
  const [errors, setErrors] = useState<(string | null)[]>(
    new Array(CHART_CONFIGS.length).fill(null)
  )
  const [allChartsData, setAllChartsData] = useState<(FractalData[] | null)[]>(
    new Array(CHART_CONFIGS.length).fill(null)
  )

  // Master time controls
  const [timeRange, setTimeRange] = useState<{ from: Time; to: Time } | null>(
    null
  )
  const [zoomLevel, setZoomLevel] = useState<number>(100) // Percentage

  // Synchronized cursor position
  const [cursorTime, setCursorTime] = useState<Time | null>(null)
  const isUpdatingCursor = useRef(false) // Prevent infinite loops

  // Initialize refs arrays
  useEffect(() => {
    chartRefs.current = new Array(CHART_CONFIGS.length).fill(null)
    chartContainerRefs.current = new Array(CHART_CONFIGS.length).fill(null)
    seriesRefs.current = new Array(CHART_CONFIGS.length).fill(null)
  }, [])

  // Helper function to convert fractal data to chart data
  const convertToChartData = (
    data: FractalData[],
    field: keyof Omit<FractalData, 'time'>
  ): LineData[] => {
    return data.map((item) => {
      const value = item[field]
      const numericValue = typeof value === 'string' ? parseFloat(value) : value
      return {
        time: (new Date(item.time).getTime() / 1000) as any,
        value: numericValue,
      }
    })
  }

  // Helper function to calculate time range based on zoom level
  // Always keeps the end of data on the right edge
  const calculateVisibleRange = (data: FractalData[]) => {
    if (data.length === 0) return null

    const firstItem = data[0]
    const lastItem = data[data.length - 1]
    if (!firstItem || !lastItem) return null

    const firstTime = new Date(firstItem.time).getTime() / 1000
    const lastTime = new Date(lastItem.time).getTime() / 1000
    const totalDuration = lastTime - firstTime

    // Calculate visible duration based on zoom level
    const visibleDuration = (totalDuration * 100) / zoomLevel

    // Always align to the right edge (end of data)
    const endTime = lastTime
    const startTime = endTime - visibleDuration

    return {
      from: Math.max(firstTime, startTime) as Time, // Don't go before data starts
      to: endTime as Time,
    }
  }

  // Apply time range to all charts
  const applyTimeRangeToAllCharts = (
    range: { from: Time; to: Time } | null
  ) => {
    if (!range) return

    chartRefs.current.forEach((chart) => {
      if (chart) {
        try {
          chart.timeScale().setVisibleRange(range)
        } catch (error) {
          console.warn('Failed to set visible range:', error)
        }
      }
    })
  }

  // Store series references for crosshair synchronization
  const seriesRefs = useRef<(ISeriesApi<'Line'> | null)[]>([])

  // Apply cursor position to all charts
  const applyCursorToAllCharts = (time: Time | null) => {
    if (isUpdatingCursor.current) return
    isUpdatingCursor.current = true

    chartRefs.current.forEach((chart, index) => {
      if (chart && seriesRefs.current[index]) {
        try {
          if (time !== null) {
            chart.setCrosshairPosition(0, time, seriesRefs.current[index]!)
          } else {
            chart.clearCrosshairPosition()
          }
        } catch (error) {
          console.warn('Failed to set crosshair position:', error)
        }
      }
    })

    setTimeout(() => {
      isUpdatingCursor.current = false
    }, 0)
  }

  // Helper function to create a single chart
  const createSingleChart = (
    container: HTMLDivElement,
    fractalData: FractalData[],
    chartIndex: number
  ): IChartApi => {
    const chart = createChart(container, {
      width,
      height: height * 0.7, // Smaller height to leave room for controls
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { visible: false }, // Hide vertical grid lines to reduce clutter
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal crosshair mode for cursor synchronization
        vertLine: {
          visible: true,
          color: '#758391',
          width: 1,
          style: 0, // Solid line
        },
        horzLine: {
          visible: false, // Hide horizontal price line
        },
      },
      // Disable zoom/scroll but allow crosshair interactions
      handleScroll: false,
      handleScale: false,
    })

    // Create line series for each metric
    const volumeStrengthSeries = chart.addSeries(LineSeries, {
      color: '#4CAF50',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    volumeStrengthSeries.setData(
      convertToChartData(fractalData, 'volumeStrength')
    )

    // Store the first series reference for crosshair synchronization
    seriesRefs.current[chartIndex] = volumeStrengthSeries

    const volumeStrengthMaSeries = chart.addSeries(LineSeries, {
      color: '#388E3C',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    volumeStrengthMaSeries.setData(
      convertToChartData(fractalData, 'volumeStrengthMa')
    )

    const priceVolumeStrengthSeries = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    priceVolumeStrengthSeries.setData(
      convertToChartData(fractalData, 'priceVolumeStrength')
    )

    const priceVolumeStrengthMaSeries = chart.addSeries(LineSeries, {
      color: '#F57C00',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    priceVolumeStrengthMaSeries.setData(
      convertToChartData(fractalData, 'priceVolumeStrengthMa')
    )

    const priceStrengthSeries = chart.addSeries(LineSeries, {
      color: '#2196F3',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    priceStrengthSeries.setData(
      convertToChartData(fractalData, 'priceStrength')
    )

    const priceStrengthMaSeries = chart.addSeries(LineSeries, {
      color: '#1976D2',
      lineWidth: 2,
      crosshairMarkerVisible: false, // Hide cursor markers
    })
    priceStrengthMaSeries.setData(
      convertToChartData(fractalData, 'priceStrengthMa')
    )

    // Add crosshair event handlers for cursor synchronization
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (isUpdatingCursor.current) return

      if (param.time !== undefined && param.time !== null) {
        setCursorTime(param.time)
      }
    })

    // Handle cursor leaving the chart area
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (isUpdatingCursor.current) return

      if (param.time === undefined) {
        setCursorTime(null)
      }
    })

    // Fit the chart content initially
    chart.timeScale().fitContent()

    return chart
  }

  // Load all CSV data in parallel
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load all CSV files in parallel for better performance
        const dataPromises = CHART_CONFIGS.map(async (config, index) => {
          try {
            const data = await parseFractalCSV(config.fileName)
            if (data.length === 0) {
              throw new Error(`No data found in ${config.fileName}`)
            }
            return { index, data, error: null }
          } catch (err) {
            return {
              index,
              data: null,
              error: err instanceof Error ? err.message : 'Unknown error',
            }
          }
        })

        const results = await Promise.all(dataPromises)

        // Update states based on results
        const newData = new Array(CHART_CONFIGS.length).fill(null)
        const newErrors = new Array(CHART_CONFIGS.length).fill(null)
        const newLoadingStates = new Array(CHART_CONFIGS.length).fill(false)

        results.forEach((result) => {
          newData[result.index] = result.data
          newErrors[result.index] = result.error
          newLoadingStates[result.index] = false
        })

        setAllChartsData(newData)
        setErrors(newErrors)
        setLoadingStates(newLoadingStates)

        // Set initial time range based on first dataset
        const firstDataset = newData.find((data) => data !== null)
        if (firstDataset) {
          const initialRange = calculateVisibleRange(firstDataset)
          setTimeRange(initialRange)
        }
      } catch (err) {
        console.error('Error loading chart data:', err)
        setErrors(new Array(CHART_CONFIGS.length).fill('Failed to load data'))
        setLoadingStates(new Array(CHART_CONFIGS.length).fill(false))
      }
    }

    loadAllData()
  }, [])

  // Create charts when data is loaded
  useEffect(() => {
    const createCharts = () => {
      allChartsData.forEach((data, index) => {
        if (
          data &&
          chartContainerRefs.current[index] &&
          !chartRefs.current[index]
        ) {
          try {
            const chart = createSingleChart(
              chartContainerRefs.current[index]!,
              data,
              index
            )
            chartRefs.current[index] = chart
          } catch (err) {
            console.error(`Error creating chart ${index}:`, err)
            setErrors((prev) => {
              const newErrors = [...prev]
              newErrors[index] = 'Failed to create chart'
              return newErrors
            })
          }
        }
      })
    }

    // Small delay to ensure DOM elements are ready
    const timer = setTimeout(createCharts, 100)
    return () => clearTimeout(timer)
  }, [allChartsData, width, height])

  // Apply time range changes to all charts
  useEffect(() => {
    if (timeRange) {
      applyTimeRangeToAllCharts(timeRange)
    }
  }, [timeRange])

  // Update time range when zoom level changes
  useEffect(() => {
    const firstDataset = allChartsData.find((data) => data !== null)
    if (firstDataset) {
      const newRange = calculateVisibleRange(firstDataset)
      setTimeRange(newRange)
    }
  }, [zoomLevel, allChartsData])

  // Apply cursor position changes to all charts
  useEffect(() => {
    applyCursorToAllCharts(cursorTime)
  }, [cursorTime])

  // Cleanup function
  useEffect(() => {
    return () => {
      chartRefs.current.forEach((chart) => {
        if (chart) {
          chart.remove()
        }
      })
      chartRefs.current = []
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      chartRefs.current.forEach((chart, index) => {
        if (chart && chartContainerRefs.current[index]) {
          chart.applyOptions({
            width: chartContainerRefs.current[index]!.clientWidth,
          })
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="fractal-charts">
      {/* Master Controls */}
      <div className="controls-panel mb-6">
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Render all charts stacked vertically */}
      {CHART_CONFIGS.map((config, index) => {
        const isLoading = loadingStates[index]
        const error = errors[index]
        const hasData = allChartsData[index] !== null

        return (
          <div key={config.fileName} className="fractal-chart relative">
            {/* Chart container */}
            <div
              ref={(el) => {
                chartContainerRefs.current[index] = el
              }}
              style={{ width, height: height * 0.7 }}
              className="border border-gray-200 rounded relative z-10"
            ></div>
            {/* Chart title positioned above chart but overlapping */}
            <div
              style={{ zIndex: 1000, top: 0, left: 0 }}
              className="absolute bg-gray-700 bg-opacity-90 px-2 py-1 rounded shadow-sm pointer-events-none"
            >
              <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                {config.displayName}
              </h3>
              <p className="text-xs text-gray-500">{config.description}</p>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white rounded">
                  <div className="text-lg">Loading {config.displayName}...</div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white rounded">
                  <div className="text-lg text-red-500">Error: {error}</div>
                </div>
              )}
              {!isLoading && !error && !hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-white rounded">
                  <div className="text-lg text-gray-500">No data available</div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
