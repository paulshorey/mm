'use client'

import { useState, useEffect } from 'react'
import { setColorSchemeAction, type ColorScheme } from './theme'

/**
 * Client-side hook to manage color scheme
 * Can be used in any client component to dynamically change the theme
 */
export function useColorScheme(initialScheme: ColorScheme = 'dark') {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(initialScheme)

  const updateColorScheme = async (scheme: ColorScheme) => {
    setColorScheme(scheme)
    // Optionally persist to cookies via server action
    await setColorSchemeAction(scheme)
    // Optionally reload the page to apply the theme globally
    // window.location.reload()
  }

  return {
    colorScheme,
    setColorScheme: updateColorScheme,
    toggleColorScheme: () =>
      updateColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
  }
}
