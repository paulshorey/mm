import { FractalRowAdd } from '@apps/common/sql/fractal'

/**
 * Parses fractal data from text format: key=value key=value
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
        data.ticker = value !== '{{ticker}}' ? value : null
      } else if (key === 'interval') {
        data.interval = value !== '{{interval}}' ? value : null
      } else if (key === 'time') {
        if (value) {
          const parsed = new Date(value)
          data.time = isNaN(parsed.getTime()) ? null : parsed
        } else {
          data.time = null
        }
      } else if (key === 'timenow') {
        if (value) {
          const parsed = new Date(value)
          data.timenow = isNaN(parsed.getTime()) ? null : parsed
        } else {
          data.timenow = null
        }
      } else if (key === 'average_strength') {
        const num = parseFloat(value)
        data.average_strength = !isNaN(num) ? num : null
      } else if (key === 'volume_strength') {
        const num = parseFloat(value)
        data.volume_strength = !isNaN(num) ? num : null
      } else if (key === 'price_strength') {
        const num = parseFloat(value)
        data.price_strength = !isNaN(num) ? num : null
      } else if (key === 'price_volume_strength') {
        const num = parseFloat(value)
        data.price_volume_strength = !isNaN(num) ? num : null
      } else if (key === 'volume_strength_ma') {
        const num = parseFloat(value)
        data.volume_strength_ma = !isNaN(num) ? num : null
      } else if (key === 'price_strength_ma') {
        const num = parseFloat(value)
        data.price_strength_ma = !isNaN(num) ? num : null
      } else if (key === 'price_volume_strength_ma') {
        const num = parseFloat(value)
        data.price_volume_strength_ma = !isNaN(num) ? num : null
      } else if (key === 'close') {
        const num = parseFloat(value)
        data.close = !isNaN(num) ? num : null
      } else if (key === 'volume') {
        const num = parseFloat(value)
        data.volume = !isNaN(num) ? num : null
      }
    }
  }
  return data
}
