import { isNumber } from '../../lib/numbers'

export const parseLine = function (text: string): any {
  const trades = []
  text = text.trim()
  const arr = text.split(' ')
  for (let str of arr) {
    let p = str.split('-')
    let dollar = Number(p[1])
    let sl = Number(p[3])
    let trade = {
      side: p[0] === 'buy' ? 'LONG' : p[0] === 'sell' ? 'SHORT' : '',
      dollar: isNumber(dollar) && dollar >= 200 && dollar <= 1000 ? dollar : 0,
      ticker: typeof p[2] === 'string' ? p[2].toUpperCase() : '',
      sl: isNumber(sl) && sl > 0 && sl <= 5 ? sl : 0,
    }
    if (trade.side && trade.dollar && trade.ticker) {
      trade.ticker = trade.ticker.toUpperCase() + '-USD'
      trades.push(trade)
    }
  }
  return trades
}
