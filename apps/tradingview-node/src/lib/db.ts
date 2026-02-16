import { Pool } from "pg";

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DATABASE_URL environment variable not set");
}

export const pool = new Pool({ connectionString });
