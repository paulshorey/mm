import { Pool } from 'pg'

let pool: Pool

/**
 * Get database connection pool
 * Uses TIMESCALE_URL environment variable for Railway PostgreSQL
 */
export const getDb = () => {
  if (!pool) {
    const connectionString = process.env.TIMESCALE_URL
    if (!connectionString) {
      throw new Error('TIMESCALE_URL environment variable not set')
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
