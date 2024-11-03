import { DydxInterface } from '@src/be/dydx'
import { Data } from '@dydxprotocol/v4-client-js/build/src/clients/types'

export async function getOrders(
  this: DydxInterface,
  ticker?: string,
  status?: string | ((status: string) => boolean)
): Promise<Data> {
  const indexer = await this.getIndexerClient()
  return (
    (await indexer.account.getSubaccountOrders(
      this.address,
      this.subaccountNumber
    )) || []
  ).filter((p: any) => {
    let keep = true
    if (ticker && p.ticker !== ticker) keep = false
    if (status) {
      if (typeof status === 'string') {
        keep = p.status === status
      } else if (typeof status === 'function') {
        keep = status(p.status)
      }
    }
    return keep
  })
}
