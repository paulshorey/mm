import { Pool } from "pg";

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
