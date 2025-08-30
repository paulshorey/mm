'use client'

import { useEffect, useState } from 'react'

import { SyncedCharts } from './SyncedCharts'

interface SyncedChartsWrapperProps {}

/**
 * Responsive wrapper component that calculates window dimensions
 * and renders charts only when document is ready
 */
export default function SyncedChartsWrapper({}: SyncedChartsWrapperProps) {
  const [dimensions, setDimensions] = useState<{
    availableWidth: number
    availableHeight: number
  } | null>(null)

  useEffect(() => {
    // Function to calculate and set dimensions
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        setDimensions({
          availableWidth: windowWidth,
          availableHeight: windowHeight,
        })
      }
    }

    // Initial calculation when component mounts
    updateDimensions()

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateDimensions, 150) // Debounce by 150ms
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Only render charts once we have dimensions
  if (!dimensions) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Initializing charts...</div>
      </div>
    )
  }

  return (
    <SyncedCharts
      availableWidth={dimensions.availableWidth}
      availableHeight={dimensions.availableHeight}
    />
  )
}
