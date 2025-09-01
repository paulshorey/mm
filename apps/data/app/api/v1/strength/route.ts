import { NextRequest } from 'next/server'
import { formatResponse } from '@apps/common/lib/nextjs/formatResponse'
import { sqlLogAdd } from '@apps/common/sql/log/add'
import { parseStrengthText } from '@/lib/parseStrengthText'
import { strengthAdd } from '@apps/common/sql/strength'
import { sendToMyselfSMS } from '@apps/common/twillio/sendToMyselfSMS'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let bodyData
  let bodyText = ''

  /**
   * Parse body
   */
  try {
    const contentType = request.headers.get('Content-Type')
    if (contentType && contentType.includes('form')) {
      bodyData = Object.fromEntries(await request.formData())
    } else {
      bodyText = await request.text()
    }

    /**
     * 1. Save strength
     */
    const strengthData = parseStrengthText(bodyText)
    // Check if we have both strength and interval values
    if (
      strengthData?.strength !== undefined &&
      strengthData?.interval !== undefined &&
      strengthData?.ticker !== undefined
    ) {
      // Validate parsed data
      if (
        strengthData.strength === null ||
        strengthData.interval === null ||
        strengthData.ticker === null
      ) {
        await sqlLogAdd({
          name: 'log',
          message: `/v1/strength invalid strengthData`,
          stack: {
            bodyText,
          },
        })
        return formatResponse(
          {
            ok: false,
            error: `Invalid strengthData`,
          },
          400
        )
      }

      try {
        // Save to database
        const result = await strengthAdd(strengthData)

        return formatResponse({
          ok: true,
          message: 'Strength data saved successfully',
          resultId: result?.id,
          data: strengthData,
        })
      } catch (error: any) {
        // Log error
        await sqlLogAdd({
          name: 'warn',
          message: `Strength endpoint error: ${error.message}`,
          stack: {
            url: request.nextUrl.href,
            bodyText: bodyText,
            method: request.method,
            stack: error.stack,
          },
        })
        // Done
        return formatResponse(
          {
            ok: false,
            error: error.message,
          },
          400
        )
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    await sqlLogAdd({
      name: 'error',
      message: `/v1/strength error "${error.message}" executing bodyText "${bodyText}"`,
      stack: {
        stack: error.stack,
        bodyText,
        bodyData,
      },
    })
    return formatResponse({ error: error.message }, 500)
  }
}

process.on('uncaughtException', async (err) => {
  const message = `Uncaught Exception: ${
    err?.message ? err.message : err.toString()
  }`
  console.error(message, err)
  sendToMyselfSMS(message)
  await sqlLogAdd({
    name: 'error',
    message,
    stack: {
      str: err?.toString(),
      json: JSON.stringify(err),
    },
  })
  return formatResponse({ error: 'Uncaught Exception' }, 500)
})

process.on('unhandledRejection', async (reason, promise) => {
  const message = `Unhandled Rejection: ${reason ? reason : promise.toString()}`
  console.error(message, promise, 'reason:', reason)
  sendToMyselfSMS(message)
  await sqlLogAdd({
    name: 'error',
    message,
    stack: {
      str: reason?.toString(),
      json: JSON.stringify(reason),
    },
  })
  return formatResponse({ error: 'Unhandled Rejection' }, 500)
})
