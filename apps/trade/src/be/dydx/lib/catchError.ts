import { sqlLogAdd } from '@my/be/sql/log/add'

export const catchError = async (error: Error, options: Record<string, any> = {}) => {
  // error
  const message = `${options.file || 'trade/src/be/dydx'} catch error`
  // notify
  console.error(message, error)
  sqlLogAdd({
    name: 'error',
    message,
    stack: error || {},
  })
}
