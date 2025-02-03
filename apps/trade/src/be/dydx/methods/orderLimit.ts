import {
  OrderExecution,
  OrderType,
  OrderTimeInForce,
  OrderSide,
} from '@dydxprotocol/v4-client-js'
import { cc } from '@my/be/cc'
import { orderAdd } from '@my/be/sql/order/add'
import { DydxInterface } from '@src/be/dydx'
import { catchError } from '@src/be/dydx/lib/catchError'

type Props = {
  clientId: number
  ticker: string
  side: 'SHORT' | 'LONG'
  coins: number
  price: number
  /**
   * Fraction of 1%
   */
  x1: number
  postOnly?: boolean
  reduceOnly?: boolean
}

export async function orderLimit(
  this: DydxInterface,
  { clientId, ticker, side, coins, price, x1, postOnly, reduceOnly }: Props
) {
  try {
    const compositeClient = await this.getCompositeClient()
    const type = OrderType.LIMIT // order type
    const timeInForce = OrderTimeInForce.GTT // UX TimeInForce
    const goodTilTimeInSeconds = 15 // 20 seconds
    const execution = OrderExecution.DEFAULT
    const multiplier = 1 + (side === 'LONG' ? x1 : -x1) // buy high / sell low
    const executionPrice = price * multiplier
    postOnly = !!postOnly // default false
    reduceOnly = !!reduceOnly // default false

    // record
    await orderAdd({
      client_id: clientId,
      type: 'LIMIT',
      ticker,
      side,
      size: coins,
      price,
    })

    // place
    compositeClient.placeOrder(
      this.subaccount,
      ticker,
      type,
      side === 'SHORT' ? OrderSide.SELL : OrderSide.BUY,
      executionPrice,
      coins,
      clientId,
      timeInForce,
      goodTilTimeInSeconds,
      execution,
      postOnly,
      reduceOnly
    )

    // notify
    await cc.warn(
      `order Limit ${side === 'LONG' ? 'Buy' : 'Sell'} ${ticker} ${
        reduceOnly ? 'reduce' : ''
      }
      $:${(coins * price).toString().substring(0, 7)} 
      @:${price.toString().substring(0, 7)}
`,
      {
        order: {
          ticker,
          type,
          side: (side === 'SHORT' ? OrderSide.SELL : OrderSide.BUY).toString(),
          coins: coins.toPrecision(5),
          executionPrice,
          clientId,
          timeInForce,
          goodTilTimeInSeconds,
          execution,
          postOnly,
          reduceOnly,
        },
        input: {
          side,
          coins,
          price,
          reduceOnly,
        },
      },
      {
        category: 'order',
        tag: 'place',
      }
    )
    return clientId

    // @ts-ignore
  } catch (err: Error) {
    catchError(err, { file: 'dydx.orderLimit' })
  }
}
