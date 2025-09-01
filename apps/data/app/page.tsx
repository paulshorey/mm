import FractalChartControlled from '../components/charts/SyncedChartsWrapper'
import { ThemeWrapper } from '../components/ThemeWrapper'

export default function Page() {
  return (
    <ThemeWrapper colorScheme="light">
      <div>
        <FractalChartControlled />
      </div>
    </ThemeWrapper>
  )
}
