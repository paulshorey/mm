import {
  // OrderExecution,
  // OrderSide,
  // OrderType,
  // OrderTimeInForce,
  BECH32_PREFIX,
  LocalWallet,
  SubaccountClient,
  CompositeClient,
  Network,
  IndexerClient,
} from '@dydxprotocol/v4-client-js'
import { sendToMyselfSMS } from '@src/be/twillio/sendToMyselfSMS'
import { addLog } from '@my/be/sql/log/add'
import { marketOrder } from './orders/market'
import { getPosition as getPositionRaw } from './actions/getPosition'
import { catchError } from '@src/be/dydx/actions/catchError'

type Output = Record<string, any> | undefined

export const dydxTestMarket = async ({
  ticker,
  side,
  size,
}: {
  ticker: string
  side: 'SHORT' | 'LONG'
  size: number
}) => {
  const data = {} as Record<string, any>
  try {
    /*
     * Inputs
     */
    if (!ticker || !side || !size || isNaN(Number(size)) || size <= 0) {
      data.error = 'bad input: !ticker | !side | !size'
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
    size = side === 'LONG' ? Math.abs(size) : -Math.abs(size) // ignore sign, use side LONG or SHORT
    data.size_add = size
    data.size_intended = data.size_before + data.size_add

    /*
     * Connection
     */
    const NETWORK = Network.mainnet()
    const wallet = await LocalWallet.fromMnemonic(
      process.env.DYDX_MNEMONIC || '',
      BECH32_PREFIX
    )
    const subaccount = new SubaccountClient(wallet, 0)
    const composite = {
      client: await CompositeClient.connect(NETWORK),
      subaccount,
    }
    const indexer = {
      client: new IndexerClient(NETWORK.indexerConfig),
      address: wallet.address || '',
      subaccountNumber: subaccount.subaccountNumber,
    }

    /*
     * Indexer data
     */
    const block = await indexer.client.utility.getHeight()
    const blockHeight = Number(block.height)
    if (!blockHeight || isNaN(blockHeight)) {
      throw new Error('blockHeight is NaN')
    }
    const getPosition = async () => {
      return getPositionRaw({ ...indexer, ticker })
    }
    const position = await getPosition()
    data.size_before = position.size

    /*
     * Ignore duplicate order
     */
    // if (position?.side === side) {
    //   // position already exists
    //   data.message = 'order ignored: duplicate'
    //   await addLog('trade-log', data.message, {
    //     position,
    //   })
    //   return data
    // }

    /*
     * Place order
     */
    const orderId = marketOrder({
      compositeClient: composite.client,
      subaccount,
      ticker,
      side,
      size,
    })

    /*
     * check1
     */
    await new Promise((resolve) =>
      setTimeout(async () => {
        // check new positions
        data.size_5000 = (await getPosition()).size
        // is balanced upated?
        data.size_remaining = data.size_intended - data.size_5000
        // continue
        resolve(undefined)
      }, 5000)
    )
    if (data.size_remaining === 0) {
      return data
    }

    /*
     * check2
     */
    await new Promise((resolve) =>
      setTimeout(async () => {
        // check new positions
        data.size_15000 = (await getPosition()).size
        // is balanced upated?
        data.size_remaining = data.size_intended - data.size_15000
        // continue
        resolve(undefined)
      }, 15000)
    )
    if (data.size_remaining === 0) {
      return data
    }

    /*
     * Order unfilled error
     */
    const message = `${ticker} ${side} ${size} order remains unfilled: ${data.size_remaining}`
    sendToMyselfSMS(message)
    await addLog('trade-error', message, {
      name: 'order-unfilled',
      message: message,
      stack: data,
    })
    // cancel attempted order
    composite.client.cancelOrder(
      subaccount,
      orderId,
      0,
      ticker,
      blockHeight + 15
    )

    // @ts-ignore
  } catch (err: Error) {
    catchError(err)
  }
  return data
}
