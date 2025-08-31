'use client'

import React from 'react'
import { useChartControlsStore } from '../state/useChartControlsStore'
import { Select } from '@mantine/core'

interface Props {
  showLabel?: boolean
}

export default function PriceControl({ showLabel = true }: Props) {
  // Get state and actions from Zustand store
  const { controlTickers, priceTicker, setPriceTicker } =
    useChartControlsStore()

  return (
    <Select
      label={showLabel ? 'Price:' : null}
      value={priceTicker}
      data={controlTickers}
      onChange={(value) => (value ? setPriceTicker(value) : undefined)}
    />
  )
}
