import { cc } from '@my/be/cc'

export const catchError = async (
  error: Error,
  options: Record<string, any> = {}
) => {
  // error
  const message =
    `${options.file || 'dydx/lib'} catchError:` +
    (typeof error?.message === 'string' ? error?.message : '!message')
  // notify
  console.error(message, error)
  cc.error(message, {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })
}
