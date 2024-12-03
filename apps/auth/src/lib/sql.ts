import { Client } from 'pg';
import { ENV } from '@/src/env';

export const pgQuery = async function (query: string, values: any[] = []): Promise<any> {
  const client = new Client({
    host: ENV.PG_HOST,
    port: ENV.PG_PORT,
    user: ENV.PG_USER,
    password: ENV.PG_PASSWORD,
    database: ENV.PG_DATABASE,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    return await client.query(query, values);
    // @ts-ignore
  } catch (error: Error) {
    console.error('Error running query:', error);
    return { error: error?.message };
  } finally {
    await client.end();
  }
};
