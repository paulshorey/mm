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
import { stopMarketOrder } from './orders/stopMarket'

type Output = Record<string, any>
const log_type = 'test-order'

export const dydxTestStopMarket = async ({
  ticker,
  side,
  size,
  triggerPrice,
}: {
  ticker: string
  side: 'SHORT' | 'LONG'
  size: number
  triggerPrice: number
}): Promise<Output | undefined> => {
  const data = {} as Record<string, any>
  try {
    /*
     * Inputs
     */
    if (!ticker || !side || !size || isNaN(Number(size))) {
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
    if (!triggerPrice || isNaN(Number(triggerPrice)) || triggerPrice <= 0) {
      data.error = 'bad input: !triggerPrice'
      throw new Error(data.error)
    }

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
    // get current price, calculate stop loss

    /*
     * Place order
     */
    stopMarketOrder({
      compositeClient: composite.client,
      subaccount,
      ticker,
      side,
      size,
      triggerPrice,
    })

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

// function closeEnough(
//   original: number,
//   compareto: number,
//   allowedDifferenceFraction: number
// ) {
//   const diff = compareto / original
//   return (
//     diff < 1 + allowedDifferenceFraction && diff > 1 - allowedDifferenceFraction
//   )
// }
