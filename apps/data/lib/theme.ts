'use server'

import { cookies } from 'next/headers'

export type ColorScheme = 'dark' | 'light'

/**
 * Server Action to set the color scheme
 * This must be called from a client component or form
 */
export async function setColorSchemeAction(scheme: ColorScheme) {
  const cookieStore = await cookies()
  cookieStore.set('colorScheme', scheme, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Optional: Set expiry for persistence
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

/**
 * Gets the current color scheme from cookies
 */
export async function getColorScheme(): Promise<ColorScheme> {
  const cookieStore = await cookies()
  const colorScheme = cookieStore.get('colorScheme')?.value as
    | ColorScheme
    | undefined
  return colorScheme || 'dark'
}
