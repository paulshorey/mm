import { ThemeWrapper } from '@/components/ThemeWrapper'
import dynamic from 'next/dynamic'

const DemoWebsocket = dynamic(() =>
  import('@/components/DemoWebsocket').then((mod) => mod.DemoWebsocket)
)

export default async function Page() {
  return (
    <ThemeWrapper colorScheme="light">
      <DemoWebsocket />
    </ThemeWrapper>
  )
}
