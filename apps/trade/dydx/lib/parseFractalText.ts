import { FractalRowAdd } from '@apps/data/sql/fractal'

/**
 * Parses fractal data from text format: key=value key=value
 * Example: ticker=ETHUSD interval=2 time=2025-08-17T20:46:00Z timenow=2025-08-17T20:46:34Z volume_strength=33.32665822909558 price_strength=-14.005869947279702 price_volume_strength=-49.941121303580324 volume_strength_ma=36.30304183354799 price_strength_ma=-12.175479058829573 price_volume_strength_ma=-45.76830524619087
 * TradingView message: ticker={{ticker}} interval={{interval}} time={{time}} timenow={{timenow}} volume_strength={{plot("volume_strength")}} price_strength={{plot("price_strength")}} price_volume_strength={{plot("price_volume_strength")}} volume_strength_ma={{plot("volume_strength_ma")}} price_strength_ma={{plot("price_strength_ma")}} price_volume_strength_ma={{plot("price_volume_strength_ma")}}
 */
export function parseFractalText(bodyText: string) {
  const data = {} as FractalRowAdd

  // Split by spaces and parse key=value pairs
  const pairs = bodyText.trim().split(/\s+/)

  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key && value !== undefined) {
      if (key === 'ticker') {
        data.ticker = value
      } else if (key === 'interval') {
        data.interval = value
      } else if (key === 'time') {
        data.time = new Date(value)
      } else if (key === 'timenow') {
        data.timenow = new Date(value)
      } else if (key === 'volume_strength') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.volume_strength = num
      } else if (key === 'price_strength') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.price_strength = num
      } else if (key === 'price_volume_strength') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.price_volume_strength = num
      } else if (key === 'volume_strength_ma') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.volume_strength_ma = num
      } else if (key === 'price_strength_ma') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.price_strength_ma = num
      } else if (key === 'price_volume_strength_ma') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.price_volume_strength_ma = num
      }
    }
  }
  return data
}
