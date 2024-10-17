'use server';

import { LogsData, LogsOptions } from './types';
import { getSql } from '@/src/lib/sql/getSql';
import { getCurrentIpAddress } from '@/src/lib/getCurrentIpAddress';

export const addLog = async function (logData: LogsData, options: LogsOptions = {}) {
  'use server';

  const type = options.type || 'log';
  const access_key = options.access_key;
  const dev = process.env.NODE_ENV === 'development';
  const addr = await getCurrentIpAddress();
  const data = { ...logData, ...addr };
  try {
    const dataString = JSON.stringify(data, null, ' ');
    await getSql(
      'INSERT INTO events.logs (type, data, access_key, dev, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [type, dataString, access_key, dev, Date.now()]
    );
    //@ts-ignore
  } catch (e: Error) {
    try {
      const dataString = JSON.stringify({
        name: 'Error lib/sql/addLog.ts catch',
        message: e.message,
        stack: e.stack,
      });
      await getSql(
        'INSERT INTO events.logs (type, data, access_key, dev, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['Error', dataString, access_key, dev, Date.now()]
      );
      //@ts-ignore
    } catch (err: Error) {
      console.log('ERROR in addLog', data, options, err);
    }
  }
  return data;
};
