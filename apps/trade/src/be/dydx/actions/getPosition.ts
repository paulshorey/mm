import { IndexerClient } from '@dydxprotocol/v4-client-js'
import { isNumber } from '../../../lib/numbers'

type Props = {
  client: IndexerClient
  address: string
  subaccountNumber: number
  ticker: string
}
type Output = Record<string, any> & { size: number }

export async function getPosition({
  client,
  address,
  subaccountNumber,
  ticker,
}: Props): Promise<Output> {
  try {
    const position = (
      (
        await client.account.getSubaccountPerpetualPositions(
          address,
          subaccountNumber
        )
      )?.positions || []
    ).filter((p: any) => p.market === ticker && p.status === 'OPEN')?.[0]
    position.size = isNumber(position.size) ? Number(position.size) : 0
    return position
  } catch (error) {
    return { size: 0, error }
  }
}
