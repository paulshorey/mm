import { NextRequest } from 'next/server'
import { formatResponse } from '@lib/common/lib/nextjs/formatResponse'
import { strengthGets } from '@lib/common/sql/strength/gets'
import { strengthAdd } from '@lib/common/sql/strength/add'
import { parseStrengthText } from '@lib/common/sql/strength/parse-text'
import { cc } from '@lib/common/cc'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/v1/tradingview
 *
 * Accepts TradingView webhook text body with strength data and saves to database.
 * Migrated from apps/market-data/src/api/strength/v1.ts
 *
 * Expected body format (text/plain):
 *   ticker=ES interval=60 time=2024-01-01 strength=0.75 price=5000 volume=1000
 */
export async function POST(request: NextRequest) {
  try {
    // Parse text body
    const bodyText = await request.text()
    const strengthData = parseStrengthText(bodyText)

    // Check if we have the required fields
    if (strengthData?.strength === undefined || strengthData?.interval === undefined || strengthData?.ticker === undefined) {
      return formatResponse(
        {
          ok: false,
          error: 'Missing required fields: ticker, interval, strength',
        },
        400
      )
    }

    // Validate parsed data
    if (strengthData.strength === null || strengthData.interval === null || strengthData.ticker === null) {
      cc.error('/api/v1/tradingview invalid strengthData', { bodyText })
      return formatResponse(
        {
          ok: false,
          error: 'Invalid strengthData',
        },
        400
      )
    }

    // Save to database
    const result = await strengthAdd(strengthData)

    return formatResponse({
      ok: true,
      message: 'Strength data saved successfully',
      resultId: result?.id,
      data: strengthData,
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    cc.error(`POST /api/v1/tradingview error: ${err.message}`, err)
    return formatResponse(
      {
        ok: false,
        error: err.message,
      },
      400
    )
  }
}

export async function GET(request: NextRequest) {
  // const callId = Math.random().toString(36).substring(7)

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')
    const timenow_gt = searchParams.get('timenow_gt')
    const timenow_lt = searchParams.get('timenow_lt')
    const server_name = searchParams.get('server_name')
    const app_name = searchParams.get('app_name')
    const node_env = searchParams.get('node_env')
    const limit = searchParams.get('limit')

    // Build where clause
    const where: any = {}
    if (ticker) where.ticker = ticker
    if (timenow_gt) where.timenow_gt = timenow_gt
    if (timenow_lt) where.timenow_lt = timenow_lt
    if (server_name) where.server_name = server_name
    if (app_name) where.app_name = app_name
    if (node_env) where.node_env = node_env
    if (limit) where.limit = parseInt(limit, 10000)

    // Call the strengthGets function
    const { rows, error } = await strengthGets({ where })

    if (error) {
      cc.error(`API strengthGet ERROR: ` + error.message, error)
      return formatResponse(
        {
          ok: false,
          error: error.message || 'Failed to fetch strength data',
        },
        500
      )
    }

    // Delete every other row if rows exist
    let filteredRows = rows
    // if (rows?.length) {
    //   filteredRows = rows.filter((_, index) => index % 2 === 0)
    // }

    return formatResponse({
      ok: true,
      rows: filteredRows || [],
    })
  } catch (error: any) {
    cc.error(`GET /api/v1/tradingview CATCH ERROR: ` + error.message, error)
    return formatResponse(
      {
        ok: false,
        error: error.message || 'Failed to fetch strength data',
      },
      500
    )
  }
}
