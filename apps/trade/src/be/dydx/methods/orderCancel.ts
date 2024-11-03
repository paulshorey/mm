import { DydxInterface } from '@src/be/dydx'
import { cc } from '@my/be/cc'

type Props = {
  ticker: string
  clientId: number
}

export async function orderCancel(this: DydxInterface, input: Props) {
  if (!input.clientId) throw new Error('dydx.orderCancel !input.clientId')
  const indexerClient = await this.getIndexerClient()
  const compositeClient = await this.getCompositeClient()
  const block = await indexerClient.utility.getHeight()
  const blockHeight = Number(block.height)
  if (!blockHeight || isNaN(blockHeight)) {
    throw new Error('blockHeight is NaN')
  }
  // cancel
  compositeClient.cancelOrder(
    this.subaccount,
    input.clientId,
    0,
    input.ticker,
    blockHeight + 15
  )
  // notify
  await cc.info(`dydx.orderCancel`, {
    ticker: input.ticker,
    clientId: input.clientId,
  })
  // done
  return input.clientId
}
