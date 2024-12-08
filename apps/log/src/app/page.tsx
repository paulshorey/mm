'use client'

import { Logs } from '@src/components/blocks/Logs'
import { ControlsAndResultsProvider } from '@src/state/ControlsAndResults'

export default async function Page() {
  return (
    <ControlsAndResultsProvider>
      <Logs />
    </ControlsAndResultsProvider>
  )
}
