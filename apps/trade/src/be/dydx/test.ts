import {
  OrderExecution,
  OrderSide,
  OrderType,
  BECH32_PREFIX,
  LocalWallet,
  SubaccountClient,
  CompositeClient,
  OrderTimeInForce,
  Network,
  IndexerClient,
} from '@dydxprotocol/v4-client-js'
import { sendToMyselfSMS } from '@src/be/twillio/sendToMyselfSMS'
import { addLog } from '@my/be/sql/log/add'

type Output = Record<string, any>
const log_type = 'test-order'

export const dydxTest = async ({
  ticker,
  side,
  // price,
}: {
  ticker: string
  side: 'SHORT' | 'LONG'
  // price: number
}): Promise<Output | undefined> => {
  const data = {} as Record<string, any>
  try {
    /*
     * Inputs
     */
    if (!ticker || !side) {
      data.error = 'bad input: !ticker | !side'
      throw new Error(data.error)
    }
    if (!/[A-Z]-USD/.test(ticker)) {
      data.error = 'malformed input: ticker="' + ticker + '"'
      throw new Error(data.error)
    }
    if (side !== 'SHORT' && side !== 'LONG') {
      data.error = 'malformed input: side="' + side + '"'
      throw new Error(data.error)
    }

    /*
     * Connection
     */
    const NETWORK = Network.mainnet()
    const client = new IndexerClient(NETWORK.indexerConfig)
    const mnemonic = process.env.DYDX_MNEMONIC || ''
    const wallet = await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX)
    const address = wallet.address || ''
    const subaccount = new SubaccountClient(wallet, 0)
    const subaccountNumber = subaccount.subaccountNumber
    // https://docs.dydx.exchange/api_integration-clients/composite_client#placing-orders
    const sideEnum = side === 'SHORT' ? OrderSide.SELL : OrderSide.BUY
    const compositeClient = await CompositeClient.connect(NETWORK)
    const clientId = Math.ceil(Math.random() * 1000000) // set to a number, can be used by the client to identify the order

    /*
     * GET DATA
     */
    const blockHeight = await client.utility.getHeight()
    const positions = (
      (
        await client.account.getSubaccountPerpetualPositions(
          address,
          subaccountNumber
        )
      )?.positions || []
    ).filter((p: any) => p.market === ticker && p.status !== 'CLOSED')
    data.positions = positions

    /*
     * DUPLICATE ORDER
     */
    // if (positions.length > 0 && positions[0].side === side) {
    //   // position already exists
    //   data.message = 'order ignored: duplicate'
    //   await addLog('trade-log', data.message, {
    //     positions,
    //   })
    //   return data
    // }

    /*
     * PLACE ORDER
     */
    const type = OrderType.MARKET // order type
    const timeInForce = OrderTimeInForce.GTT // UX TimeInForce
    const goodTilTimeInSeconds = Date.now() / 1000 + 60 * 5 // epoch seconds
    const execution = OrderExecution.DEFAULT
    const price = side === 'LONG' ? 10000000 : 0.01 //= 30_000; // price of 30,000;
    const size = 1 // subticks are calculated by the price of the order
    const postOnly = false // If true, order is post only
    const reduceOnly = false // if true, the order will only reduce the position size
    const triggerPrice = undefined // = null; // required for conditional orders
    data.tx = await compositeClient.placeOrder(
      subaccount,
      ticker,
      type,
      sideEnum,
      price,
      size,
      clientId,
      timeInForce,
      goodTilTimeInSeconds,
      execution,
      postOnly,
      reduceOnly,
      triggerPrice
    )

    // @ts-ignore
  } catch (err: Error) {
    console.error('catch', err)
    // Error
    const message =
      `${log_type} catch: ` +
      (typeof err?.message === 'string' ? err?.message : 'unknown')
    // notify sms
    sendToMyselfSMS(message)
    // notify log
    await addLog('trade-error', message, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    })
  }
  return data
}
