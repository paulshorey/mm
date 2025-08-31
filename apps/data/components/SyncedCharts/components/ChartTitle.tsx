'use client'

import React from 'react'

interface ChartTitleProps {
  heading: string | React.ReactNode
  hasData: boolean
  children?: React.ReactNode
}

export default function ChartTitle({
  heading,
  hasData,
  children,
}: ChartTitleProps) {
  return (
    <div style={{ zIndex: 10000 }} className="absolute left-0 top-0">
      {heading}
      {!hasData && children}
    </div>
  )
}
