import { POST } from '@src/app/api/v1/market/route'
import { executeOrderMarket } from '@src/be/dydx/executeOrderMarket'
import { parseOrdersText } from '@src/be/dydx/lib/parseOrdersText'
import { NextRequest } from 'next/server'

jest.mock('@src/be/dydx/executeOrderMarket', () => ({
  executeOrderMarket: jest.fn(),
}))

jest.mock('@src/be/dydx/lib/parseOrdersText', () => ({
  parseOrdersText: jest.fn(),
}))

jest.mock('@my/be/sql/log/add', () => ({
  logAdd: jest.fn(),
}))

jest.mock('@my/be/twillio/sendToMyselfSMS', () => ({
  sendToMyselfSMS: jest.fn(),
}))

describe('/api/v1/market', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call executeOrderMarket with correct parameters for "sui:100"', async () => {
    const order = {
      ticker: 'SUI-USD',
      position: 100,
      side: 'BUY',
      timeInForce: 'GTT',
      postOnly: false,
    }
    ;(parseOrdersText as jest.Mock).mockReturnValue([order])

    const bodyText = 'sui:100'
    const request = new NextRequest('http://localhost/api/v1/market?access_key=testkeyx', {
      method: 'POST',
      body: bodyText,
    })

    await POST(request)

    expect(executeOrderMarket).toHaveBeenCalledWith(order)
  })

  it('should call executeOrderMarket with correct parameters for "sui:0"', async () => {
    const order = {
      ticker: 'SUI-USD',
      position: 0,
      side: 'BUY',
      timeInForce: 'GTT',
      postOnly: false,
    }
    ;(parseOrdersText as jest.Mock).mockReturnValue([order])
    const bodyText = 'sui:0'
    const request = new NextRequest('http://localhost/api/v1/market?access_key=testkeyx', {
      method: 'POST',
      body: bodyText,
    })

    await POST(request)

    expect(executeOrderMarket).toHaveBeenCalledWith(order)
  })
})
