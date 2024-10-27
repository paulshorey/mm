import {
  OrderExecution,
  OrderType,
  OrderTimeInForce,
  OrderSide,
} from '@dydxprotocol/v4-client-js'

type Props = {
  compositeClient: any
  subaccount: any
  ticker: string
  side: 'SHORT' | 'LONG'
  size: number
}

export const marketOrder = ({
  compositeClient,
  subaccount,
  ticker,
  side,
  size,
}: Props) => {
  const orderId = Math.ceil(Math.random() * 1000000)
  const type = OrderType.MARKET // order type
  const timeInForce = OrderTimeInForce.GTT // UX TimeInForce
  const goodTilTimeInSeconds = Date.now() / 1000 + 60 * 5 // epoch seconds
  const execution = OrderExecution.DEFAULT
  const executionPrice = side === 'LONG' ? 10000000 : 0.01 //= 30_000; // price of 30,000;
  const postOnly = false // If true, order is post only
  const reduceOnly = false // if true, the order will only reduce the position size
  compositeClient.placeOrder(
    subaccount,
    ticker,
    type,
    side === 'SHORT' ? OrderSide.SELL : OrderSide.BUY,
    executionPrice,
    size,
    orderId,
    timeInForce,
    goodTilTimeInSeconds,
    execution,
    postOnly,
    reduceOnly
  )
  return orderId
}
