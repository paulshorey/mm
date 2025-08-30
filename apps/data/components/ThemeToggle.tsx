'use client'

import { useColorScheme } from '../lib/theme-client'
import { Button } from '@mantine/core'

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme()

  return (
    <Button onClick={toggleColorScheme} variant="subtle">
      {colorScheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </Button>
  )
}
