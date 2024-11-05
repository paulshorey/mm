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
import { sendToMyselfSMS } from '@my/be/twillio/sendToMyselfSMS'
import { logAdd } from '@my/be/sql/log/add'
import { Order } from '@src/be/dydx/methods/getOrders'

type Output = Record<string, any>

/**
 * Throws error if something went wrong!
 */
export const dydxScout = async (): Promise<Output | undefined> => {
  const data = {} as Output
  try {
    // Connect to my DYDX
    const NETWORK = Network.mainnet()
    const client = new IndexerClient(NETWORK.indexerConfig)
    const ticker = 'AVAX-USD'

    // const compositeClient = await CompositeClient.connect(NETWORK);
    const mnemonic = process.env.DYDX_MNEMONIC || ''
    const wallet = await LocalWallet.fromMnemonic(mnemonic, BECH32_PREFIX)
    const address = wallet.address || ''
    const subaccount = new SubaccountClient(wallet, 0)
    const subaccountNumber = subaccount.subaccountNumber
    const accountData = (
      await client.account.getSubaccount(address, subaccountNumber)
    )?.subaccount

    // Fetch data
    const blockHeight = await client.utility.getHeight()
    // const trades = (await client.markets.getPerpetualMarketTrades(ticker))
    //   ?.trades
    const orders = (
      (await client.account.getSubaccountOrders(address, subaccountNumber)) ||
      []
    ).filter((p: Order) => {
      return (
        p.status === 'OPEN' ||
        p.status === 'UNTRIGGERED' ||
        p.status === 'PENDING'
      )
    })
    // const positions = (
    //   (
    //     await client.account.getSubaccountPerpetualPositions(
    //       address,
    //       subaccountNumber
    //     )
    //   )?.positions || []
    // ).filter((p: any) => p.status === 'OPEN')
    // const orderbook = await client.markets.getPerpetualMarketOrderbook(ticker)
    // const asksAndBids = { asks: orderbook.asks, bids: orderbook.bids }
    // const sparklines = await client.markets.getPerpetualMarketSparklines()

    // Format data
    data.positions = {
      equity: Number(accountData.equity).toFixed(2),
      margin: Number(accountData.freeCollateral).toFixed(2),
      ...accountData.openPerpetualPositions,
    }
    data.orders = orders
    data.blockHeight = blockHeight
    // data.asksAndBids = asksAndBids
    // data.trades = trades
    // data.sparklines = sparklines

    // @ts-ignore
  } catch (err: Error) {
    // Error
    const message =
      'DYDX Error! in scout ' +
      (typeof err?.message === 'string' ? err?.message : 'unknown')
    // notify sms
    sendToMyselfSMS(message)
    // notify log
    await logAdd('error', message, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    })
  }
  return data
}
