import FractalChart from '../../components/FractalChart'

export default async function Page() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fractal Analysis</h1>
      <FractalChart width={1200} height={600} />
    </div>
  )
}
