import { NextRequest } from 'next/server'
import { formatResponse } from '@lib/common/lib/nextjs/formatResponse'
import { cc } from '@lib/common/cc'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Docs: https://docs.rasterwise.com/docs/getscreenshot/api-reference-0/
export async function GET(request: NextRequest) {
  try {
    // const url = new URL(
    //   'https://strength.finance/?hoursBack=240h&interval=%5B%224%22%2C%2212%22%2C%2230%22%2C%2260%22%5D&tickers=%5B%22GC1%21%22%5D'
    // )
    // const apiKey = 's9M14e7kMH16bOaHA5H06Wk9VQv0kpwai6ayhxdb'
    // const fetchUrl = `https://api.rasterwise.com/v1/get-screenshot?apikey=${apiKey}&url=${encodeURIComponent(
    //   url.toString()
    // )}&width=754&height=354&fullPage=true&devicefactor=3`
    const fetchUrl =
      'https://api.rasterwise.com/v1/get-screenshot?apikey=s9M14e7kMH16bOaHA5H06Wk9VQv0kpwai6ayhxdb&url=https%3A%2F%2Fstrength.finance%2F%3FhoursBack%3D240h%26interval%3D%255B%25224%2522%252C%252212%2522%252C%252230%2522%252C%252260%2522%255D%26tickers%3D%255B%2522GC1%2521%2522%255D&width=754&height=354&fullPage=true&devicefactor=3'
    const screenshotData = await fetch(fetchUrl)

    return formatResponse({
      ok: true,
      screenshotData,
    })
  } catch (error: any) {
    cc.error(
      `GET /api/v1/strength-screenshot CATCH ERROR: ` + error.message,
      error
    )
    return formatResponse(
      {
        ok: false,
        error: error.message || 'Failed to fetch strength data',
      },
      500
    )
  }
}
