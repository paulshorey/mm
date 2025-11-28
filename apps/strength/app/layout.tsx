import { SCALE_FACTOR } from '@/charts/constants'
import './global.css'

export const metadata = {
  title: 'Data',
}

export default async function RootLayout({ children }: { children: any }) {
  // Don't set any providers here - let pages handle their own theming
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body
        suppressHydrationWarning
        className="overflow-hidden"
        style={{
          transform: `scale(${1 / SCALE_FACTOR})`,
          width: `${100 * SCALE_FACTOR}%`,
          height: `${100 * SCALE_FACTOR}%`,
        }}
      >
        {children}
      </body>
    </html>
  )
}
