import { sendToMyselfSMS } from '@src/be/twillio/sendToMyselfSMS'
import { addLog } from '@my/be/sql/log/add'

export const catchError = async (error: Error) => {
  console.error('catch error', error)
  // Error
  const message =
    `trade-catch-error: ` +
    (typeof error?.message === 'string' ? error?.message : '!message')
  // notify sms
  sendToMyselfSMS(message)
  // notify log
  await addLog('trade-catch-error', message, {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })
}
