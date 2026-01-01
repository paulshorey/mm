'use client'

import { useState, useEffect } from 'react'
import { Chart } from './Chart'

export function HistoricalChart() {
  const [dimensions, setDimensions] = useState<{
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    // Wait for window to be available
    if (typeof window === 'undefined') return

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Initial dimensions
    updateDimensions()

    // Update on resize
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Don't render until we have dimensions
  if (!dimensions) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#1a1a2e',
          color: '#e0e0e0',
        }}
      >
        Loading chart...
      </div>
    )
  }

  return <Chart width={dimensions.width} height={dimensions.height} />
}
