import FractalChartControlled from '../components/SyncedCharts/SyncedChartsWrapper'
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
