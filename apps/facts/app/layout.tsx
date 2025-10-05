import type { Metadata } from 'next'
import '@mantine/core/styles.css'
import './globals.css'
import { MantineProvider } from '@mantine/core'

export const metadata: Metadata = {
  title: 'Facts.News - Coming Soon',
  description: 'No nonsense. No pandering to political affiliations. Down to business lists of facts, events, statistics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  )
}