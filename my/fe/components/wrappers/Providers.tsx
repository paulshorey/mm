import { MantineProvider } from "@mantine/core";
import { theme } from "@my/fe/styles/theme";

export function Providers({ children, defaultColorScheme }: any) {
  return (
    <MantineProvider forceColorScheme={defaultColorScheme} theme={theme}>
      {children}
    </MantineProvider>
  );
}
