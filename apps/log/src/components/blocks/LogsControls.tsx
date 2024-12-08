'use client'

import { useControlsAndResults } from '@src/state/ControlsAndResults'

export function LogsControls() {
  const { controls } = useControlsAndResults()
  return <>{JSON.stringify(controls)}</>
}
