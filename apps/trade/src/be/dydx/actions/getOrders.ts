import { IndexerClient } from '@dydxprotocol/v4-client-js'

type Props = {
  client: IndexerClient
  address: string
  subaccountNumber: number
  ticker: string
}

export async function getOrders({
  client,
  address,
  subaccountNumber,
  ticker,
}: Props) {
  return (
    (await client.account.getSubaccountOrders(address, subaccountNumber)) || []
  ).filter((p: any) => p.ticker === ticker && p.status === 'OPEN')
}
