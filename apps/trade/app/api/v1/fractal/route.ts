import { NextRequest, NextResponse } from 'next/server'
import { formatResponse } from '../../../../../data/lib/nextjs/formatResponse'
import { fractalAdd, FractalRowAdd } from '../../../../../data/sql/fractal'
import { sqlLogAdd } from '../../../../../data/sql/log/add'
import { parseFractalText } from '@/dydx/lib/parseFractalText'

export const maxDuration = 60

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  let bodyText = ''
  try {
    bodyText = await request.text()
  } catch {}
  try {
    // Parse the fractal data
    const fractalData = parseFractalText(bodyText)

    // Validate parsed data
    if (!fractalData.interval || fractalData.interval.trim() === '') {
      throw new Error('Invalid interval value')
    }
    if (isNaN(fractalData.time.getTime())) {
      throw new Error('Invalid time format')
    }
    if (isNaN(fractalData.timenow.getTime())) {
      throw new Error('Invalid timenow format')
    }

    // Save to database
    const result = await fractalAdd(fractalData)

    // Log success
    return formatResponse({
      ok: true,
      message: 'Fractal data saved successfully',
      data: {
        id: result?.id,
        ticker: fractalData.ticker,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    // Log the error
    await sqlLogAdd({
      name: 'warn',
      message: `Fractal endpoint error: ${error.message}`,
      stack: {
        url: request.nextUrl.href,
        bodyText: bodyText,
        method: request.method,
        stack: error.stack,
      },
    })

    return formatResponse(
      {
        ok: false,
        error: error.message,
      },
      400
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleRequest(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleRequest(request)
}
