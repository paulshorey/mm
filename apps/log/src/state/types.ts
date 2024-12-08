import React from 'react'
import { createContext } from 'react'

export type ProviderProps = {
  children: React.ReactNode
}
export type SearchParams = Record<string, string>
export type Controls = {
  groupBy: string
  where: Record<string, string>
}
export type Results = {}
export type ContextValue = {
  controls: Controls
  results: Results[]
  addControls: (newControls: Partial<Controls>) => void
}

export const Context = createContext<ContextValue | undefined>(undefined)
