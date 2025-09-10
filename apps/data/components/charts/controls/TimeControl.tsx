'use client'

import React from 'react'
import { useChartControlsStore } from '../state/useChartControlsStore'
import { Select } from '@mantine/core'

interface Props {
  showLabel?: boolean
}

export default function TimeControl({ showLabel = true }: Props) {
  const { hoursBack, setHoursBack } = useChartControlsStore()

  return (
    <Select
      style={{ width: '80px', zIndex: 10000000 }}
      label={showLabel ? 'Range' : null}
      value={hoursBack.toString()}
      data={['12', '24', '36', '48', '60', '120', '240']}
      onChange={(value) => (value ? setHoursBack(parseInt(value)) : undefined)}
    />
  )
}
