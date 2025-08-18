import FractalChartControlled from '../../components/FractalChartControlled'

export default async function Page() {
  return (
    <div className="p-6">
      <FractalChartControlled width={1200} height={600} />
    </div>
  )
}
