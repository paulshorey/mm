'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import HighchartsReact from 'highcharts-react-official'
import type HighchartsType from 'highcharts/highstock'

// Dark theme colors
const darkTheme = {
  background: '#1a1a2e',
  text: '#e0e0e0',
  gridLine: '#2d2d4a',
  axisLine: '#4a4a6a',
  candleUp: '#26a69a',
  candleDown: '#ef5350',
}

interface ChartProps {
  width: number
  height: number
}

const DATA_URL = 'https://demo-live-data.highcharts.com/aapl-historical.json'

const DEBOUNCE_MS = 3000 // Only fetch new data once per 3 seconds

export function Chart({ width, height }: ChartProps) {
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [Highcharts, setHighcharts] = useState<typeof HighchartsType | null>(
    null
  )

  // Initialize Highcharts with modules on client side only
  useEffect(() => {
    async function initHighcharts() {
      const HC = (await import('highcharts/highstock')).default

      // Dynamic imports for modules - use type assertion for runtime flexibility
      const exportingMod = await import('highcharts/modules/exporting')
      const accessibilityMod = await import('highcharts/modules/accessibility')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = exportingMod as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accMod = accessibilityMod as any

      // Handle different module export formats
      const exportingFn = mod.default ?? mod
      const accessibilityFn = accMod.default ?? accMod

      if (typeof exportingFn === 'function') exportingFn(HC)
      if (typeof accessibilityFn === 'function') accessibilityFn(HC)

      setHighcharts(HC)
    }
    initHighcharts()
  }, [])

  // Callback for loading data on zoom/pan (debounced)
  const afterSetExtremes = useCallback(
    (e: HighchartsType.AxisSetExtremesEventObject) => {
      const chart = chartRef.current?.chart
      if (!chart) return

      // Clear any pending request
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Debounce: wait before fetching to avoid too many requests
      debounceRef.current = setTimeout(() => {
        chart.showLoading('Loading data from server...')

        fetch(
          `${DATA_URL}?start=${Math.round(e.min)}&end=${Math.round(e.max)}`
        )
          .then((res) => res.ok && res.json())
          .then((data) => {
            if (data && chart.series[0]) {
              chart.series[0].setData(data)
            }
            chart.hideLoading()
          })
          .catch((error) => {
            console.error('Error loading data:', error.message)
            chart.hideLoading()
          })
      }, DEBOUNCE_MS)
    },
    []
  )

  // Load initial data when Highcharts is ready
  useEffect(() => {
    if (!Highcharts) return

    fetch(DATA_URL)
      .then((res) => res.ok && res.json())
      .then((data) => {
        const chart = chartRef.current?.chart
        if (data && chart?.series?.[0]) {
          // Add a null value for the end date
          data.push(['2011-10-14 18:00', null, null, null, null])
          chart.series[0].setData(data)
        }
      })
      .catch((error) => console.error('Error loading initial data:', error))
  }, [Highcharts])

  const options: HighchartsType.Options = {
    chart: {
      type: 'candlestick',
      backgroundColor: darkTheme.background,
      style: {
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      zooming: {
        type: 'x',
      },
    },

    title: {
      text: 'AAPL history by the minute from 1998 to 2011',
      align: 'left',
      style: {
        color: darkTheme.text,
        fontSize: '18px',
        fontWeight: '600',
      },
    },

    subtitle: {
      text: 'Displaying 1.7 million data points in Highcharts Stock by async server loading',
      align: 'left',
      style: {
        color: '#a0a0b0',
      },
    },

    navigator: {
      adaptToUpdatedData: false,
      series: {
        data: [],
      },
      outlineColor: darkTheme.axisLine,
      maskFill: 'rgba(102, 133, 194, 0.2)',
    },

    scrollbar: {
      liveRedraw: false,
      barBackgroundColor: darkTheme.axisLine,
      trackBackgroundColor: darkTheme.gridLine,
    },

    rangeSelector: {
      buttons: [
        { type: 'hour', count: 1, text: '1h' },
        { type: 'day', count: 1, text: '1d' },
        { type: 'month', count: 1, text: '1m' },
        { type: 'year', count: 1, text: '1y' },
        { type: 'all', text: 'All' },
      ],
      inputEnabled: false,
      selected: 4, // 'All' selected by default
      buttonTheme: {
        fill: darkTheme.gridLine,
        stroke: darkTheme.axisLine,
        style: {
          color: darkTheme.text,
        },
        states: {
          hover: {
            fill: darkTheme.axisLine,
          },
          select: {
            fill: '#4a6fa5',
            style: {
              color: '#ffffff',
            },
          },
        },
      },
      labelStyle: {
        color: darkTheme.text,
      },
    },

    xAxis: {
      events: {
        afterSetExtremes,
      },
      minRange: 3600 * 1000, // one hour
      gridLineColor: darkTheme.gridLine,
      lineColor: darkTheme.axisLine,
      tickColor: darkTheme.axisLine,
      labels: {
        style: {
          color: darkTheme.text,
        },
      },
    },

    yAxis: {
      floor: 0,
      gridLineColor: darkTheme.gridLine,
      lineColor: darkTheme.axisLine,
      labels: {
        style: {
          color: darkTheme.text,
        },
      },
    },

    series: [
      {
        type: 'candlestick',
        name: 'AAPL',
        data: [],
        dataGrouping: {
          enabled: false,
        },
        color: darkTheme.candleDown,
        upColor: darkTheme.candleUp,
        lineColor: darkTheme.candleDown,
        upLineColor: darkTheme.candleUp,
      },
    ],

    credits: {
      enabled: false,
    },

    exporting: {
      buttons: {
        contextButton: {
          theme: {
            fill: darkTheme.gridLine,
          },
        },
      },
    },

    loading: {
      style: {
        backgroundColor: darkTheme.background,
      },
      labelStyle: {
        color: darkTheme.text,
      },
    },
  }

  // Show loading state while Highcharts is initializing
  if (!Highcharts) {
    return (
      <div
        style={{
          width,
          height,
          background: darkTheme.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: darkTheme.text,
        }}
      >
        Initializing chart...
      </div>
    )
  }

  return (
    <div
      style={{
        width,
        height,
        background: darkTheme.background,
      }}
    >
      <HighchartsReact
        highcharts={Highcharts}
        constructorType="stockChart"
        options={options}
        ref={chartRef}
        containerProps={{
          style: { width: '100%', height: '100%' },
        }}
      />
    </div>
  )
}
