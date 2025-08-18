'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  IChartApi,
  LineData,
  LineSeries,
} from 'lightweight-charts'
import { FractalData, parseFractalCSV } from '../lib/parseFractalCSV'

interface FractalChartProps {
  width?: number
  height?: number
}

export default function FractalChart({
  width = 800,
  height = 400,
}: FractalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDataAndCreateChart = async () => {
      try {
        setIsLoading(true)

        // Parse the CSV data
        const fractalData = await parseFractalCSV('/ETHUSD-2.csv')

        if (fractalData.length === 0) {
          setError('No data found in CSV file')
          return
        }

        // Create the chart
        const chart = createChart(chartContainerRef.current!, {
          width,
          height,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333',
          },
          grid: {
            vertLines: { color: '#e1e1e1' },
            horzLines: { color: '#e1e1e1' },
          },
          rightPriceScale: {
            borderColor: '#cccccc',
          },
          timeScale: {
            borderColor: '#cccccc',
            timeVisible: true,
            secondsVisible: false,
          },
        })

        chartRef.current = chart

        // Convert time strings to timestamps for the chart
        const convertToChartData = (
          data: FractalData[],
          field: keyof Omit<FractalData, 'time'>
        ): LineData[] => {
          const result = data.map((item) => {
            const value = item[field]
            const numericValue =
              typeof value === 'string' ? parseFloat(value) : value
            return {
              time: (new Date(item.time).getTime() / 1000) as any,
              value: numericValue,
            }
          })

          return result
        }

        // Create line series for each metric
        const volumeStrengthSeries = chart.addSeries(LineSeries, {
          color: '#2196F3',
          lineWidth: 2,
          title: 'Volume Strength',
        })
        volumeStrengthSeries.setData(
          convertToChartData(fractalData, 'volumeStrength')
        )

        const volumeStrengthMaSeries = chart.addSeries(LineSeries, {
          color: '#1976D2',
          lineWidth: 2,
          title: 'Volume Strength MA',
        })
        volumeStrengthMaSeries.setData(
          convertToChartData(fractalData, 'volumeStrengthMa')
        )

        const priceStrengthSeries = chart.addSeries(LineSeries, {
          color: '#FF9800',
          lineWidth: 2,
          title: 'Price Strength',
        })
        priceStrengthSeries.setData(
          convertToChartData(fractalData, 'priceStrength')
        )

        const priceStrengthMaSeries = chart.addSeries(LineSeries, {
          color: '#F57C00',
          lineWidth: 2,
          title: 'Price Strength MA',
        })
        priceStrengthMaSeries.setData(
          convertToChartData(fractalData, 'priceStrengthMa')
        )

        const priceVolumeStrengthSeries = chart.addSeries(LineSeries, {
          color: '#4CAF50',
          lineWidth: 2,
          title: 'Price Volume Strength',
        })
        priceVolumeStrengthSeries.setData(
          convertToChartData(fractalData, 'priceVolumeStrength')
        )

        const priceVolumeStrengthMaSeries = chart.addSeries(LineSeries, {
          color: '#388E3C',
          lineWidth: 2,
          title: 'Price Volume Strength MA',
        })
        priceVolumeStrengthMaSeries.setData(
          convertToChartData(fractalData, 'priceVolumeStrengthMa')
        )

        // Fit the chart content
        chart.timeScale().fitContent()

        setIsLoading(false)
      } catch (err) {
        console.error('Error loading chart data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    const initChart = () => {
      if (!chartContainerRef.current) {
        setTimeout(initChart, 100)
        return
      }
      loadDataAndCreateChart()
    }

    initChart()

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [width, height])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="fractal-chart">
      <h3 className="text-xl font-semibold mb-4">
        Fractal Analysis - ETH/USD 2-Minute Chart
      </h3>

      {!isLoading && !error && (
        <div className="mb-2 text-sm text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>
              <span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span>
              Volume Strength
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-blue-700 mr-1"></span>
              Volume Strength MA
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-orange-500 mr-1"></span>
              Price Strength
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-orange-700 mr-1"></span>
              Price Strength MA
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-green-500 mr-1"></span>
              Price Volume Strength
            </span>
            <span>
              <span className="inline-block w-3 h-3 bg-green-700 mr-1"></span>
              Price Volume Strength MA
            </span>
          </div>
        </div>
      )}

      <div
        ref={chartContainerRef}
        style={{ width, height }}
        className="relative"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-lg">Loading chart data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-lg text-red-500">Error: {error}</div>
          </div>
        )}
      </div>
    </div>
  )
}
