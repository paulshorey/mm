import { FractalRowAdd } from '@apps/common/sql/fractal'

/**
 * Parses fractal data from text format: key=value key=value
 * Example: ticker=ETHUSD interval=2 time=2025-08-17T20:46:00Z timenow=2025-08-17T20:46:34Z average_strength=33.72373292384374 price=4123 volume=456
 * TradingView message: ticker={{ticker}} interval={{interval}} time={{time}} timenow={{timenow}} average_strength={{plot("average_strength")}} close={{close}} volume={{volume}}
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
      } else if (key === 'average_strength') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.average_strength = num
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
      } else if (key === 'close') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.close = num
      } else if (key === 'volume') {
        const num = parseFloat(value)
        if (!isNaN(num)) data.volume = num
      }
    }
  }
  return data
}
