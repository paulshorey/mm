import '@my/fe/styles/tailwind.css';
import '@my/fe/styles/global.scss';
import '@mantine/core/styles.css';
import '@my/fe/styles/mantine.scss';
import { Providers } from '@my/fe/components/wrappers/Providers';

export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const metadata = {
  title: 'Logs',
};

export default async function RootLayout({ children }: { children: any }) {
  const defaultColorScheme = 'dark';
  return (
    <html lang="en" data-mantine-color-scheme={defaultColorScheme} suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <Providers defaultColorScheme={defaultColorScheme}>{children}</Providers>
      </body>
    </html>
  );
}
