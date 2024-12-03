export const ENV = {
  PG_HOST: process.env.PG_HOST || '',
  PG_PORT: Number(process.env.PG_PORT) || 5432,
  PG_USER: process.env.PG_USER || '',
  PG_PASSWORD: process.env.PG_PASSWORD || '',
  PG_DATABASE: process.env.PG_DATABASE || '',
  //
  LOG_ENV: process.env.LOG_ENV || 'localhost',
};
