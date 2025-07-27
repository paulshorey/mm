import { Pool } from "pg";

/**
 * A `pg.Pool` instance for connecting to the orders database.
 *
 * This pool is configured using environment variables for the host, port, user,
 * password, and database name. It is used throughout the application to interact
 * with the database that stores order-related data.
 *
 * The `ssl` option is configured to allow connections to databases with self-signed
 * certificates by setting `rejectUnauthorized` to `false`. This is common in
 * development environments but should be reviewed for production use.
 */
export const pool = new Pool({
  host: process.env.PG_EVENTS_HOST,
  port: Number(process.env.PG_EVENTS_PORT),
  user: process.env.PG_EVENTS_USER,
  password: process.env.PG_EVENTS_PASSWORD,
  database: process.env.PG_EVENTS_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});
