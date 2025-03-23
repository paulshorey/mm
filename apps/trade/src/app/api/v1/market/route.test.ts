/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from './route'
import { formatResponse } from '@my/be/api/formatResponse'
import { executeOrderMarket } from '@src/be/dydx/executeOrderMarket'
import { parseOrdersText } from '@src/be/dydx/lib/parseOrdersText'
import { logAdd } from '@my/be/sql/log/add'

// Mock all imported dependencies
jest.mock('@my/be/api/formatResponse', () => ({
  formatResponse: jest.fn((data, status) => ({
    json: () => data,
    status: status || 200,
  })),
}))

jest.mock('@src/be/dydx/executeOrderMarket', () => ({
  __esModule: true,
  ...jest.requireActual('@src/be/dydx/executeOrderMarket'),
  executeOrderMarket: jest.fn(),
}))

jest.mock('@src/be/dydx/lib/parseOrdersText', () => ({
  parseOrdersText: jest.fn(),
}))

jest.mock('@my/be/sql/log/add', () => ({
  logAdd: jest.fn(),
}))

describe('POST API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully execute a market order', async () => {
    // Setup mocks
    const mockParsedOrder = { ticker: 'btc', position: 1000, sl: 1 }
    const mockOrderResult = { id: '123', status: 'success' }

    ;(parseOrdersText as jest.Mock).mockReturnValue([mockParsedOrder])
    ;(executeOrderMarket as jest.Mock).mockResolvedValue(mockOrderResult)

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api', {
      method: 'POST',
      body: 'btc:1000:1',
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    // Add search params to the request
    Object.defineProperty(request, 'nextUrl', {
      value: {
        searchParams: new URLSearchParams('access_key=testkeyx'),
      },
    })

    // Execute the handler
    const response = await POST(request)

    // Assertions
    expect(parseOrdersText).toHaveBeenCalledWith('btc:1000:1')
    expect(executeOrderMarket).toHaveBeenCalledWith(mockParsedOrder)
    expect(formatResponse).toHaveBeenCalledWith({
      ok: true,
      data: [mockOrderResult],
      tvline: 1,
    })
  })

  it('should return error when parseOrdersText fails', async () => {
    // Setup mocks
    ;(parseOrdersText as jest.Mock).mockReturnValue([])

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api', {
      method: 'POST',
      body: 'invalid-order-text',
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    // Add search params to the request
    Object.defineProperty(request, 'nextUrl', {
      value: {
        searchParams: new URLSearchParams('access_key=testkeyx'),
      },
    })

    // Execute the handler
    await POST(request)

    // Assertions
    expect(parseOrdersText).toHaveBeenCalledWith('invalid-order-text')
    expect(logAdd).toHaveBeenCalled()
    expect(formatResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: '!parsedOrders[0]',
      }),
      405
    )
  })

  it('should return error when executeOrderMarket fails', async () => {
    // Setup mocks
    const mockParsedOrder = { ticker: 'btc', position: 1000, sl: 1 }
    const mockError = { error: 'Failed to execute order' }

    ;(parseOrdersText as jest.Mock).mockReturnValue([mockParsedOrder])
    ;(executeOrderMarket as jest.Mock).mockResolvedValue(mockError)

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api', {
      method: 'POST',
      body: 'btc:1000:1',
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    // Add search params to the request
    Object.defineProperty(request, 'nextUrl', {
      value: {
        searchParams: new URLSearchParams('access_key=testkeyx'),
      },
    })

    // Execute the handler
    await POST(request)

    // Assertions
    expect(executeOrderMarket).toHaveBeenCalledWith(mockParsedOrder)
    expect(formatResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'data?.error',
      }),
      405
    )
  })
})
