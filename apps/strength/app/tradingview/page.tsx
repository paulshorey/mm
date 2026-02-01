import SyncedChartsWrapper from '../../pages/tradingview/SyncedChartsWrapper'
import { ThemeWrapper } from '../../components/ThemeWrapper'

export default function Page() {
  return (
    <ThemeWrapper colorScheme="dark">
      <SyncedChartsWrapper />
    </ThemeWrapper>
  )
}
