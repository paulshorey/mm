import { useMantineColorScheme, Button, Group } from '@mantine/core'
import stytchEditMeta from '@my/be/auth/actions/stytchEditMeta'

export function ColorSchemeSwitcher() {
  const { setColorScheme } = useMantineColorScheme()

  return (
    <Group>
      <Button
        onClick={() => {
          setColorScheme('light')
          stytchEditMeta({ color_scheme: 'light' })
        }}
      >
        Light
      </Button>
      <Button
        onClick={() => {
          setColorScheme('dark')
          stytchEditMeta({ color_scheme: 'dark' })
        }}
      >
        Dark
      </Button>
    </Group>
  )
}
