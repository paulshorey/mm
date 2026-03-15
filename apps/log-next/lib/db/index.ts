import { Pool } from 'pg'

let pool: Pool

/**
 * Get database connection pool
 * Uses TRADING_DB_URL environment variable for Railway PostgreSQL
 */
export const getDb = () => {
  if (!pool) {
    const connectionString = process.env.TRADING_DB_URL
    if (!connectionString) {
      throw new Error('TRADING_DB_URL environment variable not set')
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return pool
}
