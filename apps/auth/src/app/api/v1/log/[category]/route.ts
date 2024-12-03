import { NextRequest } from 'next/server';
import { ENV } from '@src/env';
import { formatResponse } from '@/src/lib/response';
import { qsObjectToString } from '@/src/lib/url';
import { pgQuery } from '@/src/lib/sql';

type RouteParams = {
  params: {
    category: string;
  };
};

// Server action that takes IP as input and fetches data
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const qs = Object.fromEntries(request.nextUrl.searchParams.entries());
    const body = await request.json();
    const category = params.category;
    const headers = Object.fromEntries(request.headers.entries());
    const data = {
      category,
      body,
      headers,
    };

    await pgQuery(
      `INSERT INTO log (time, type, message, stack, env, date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        Date.now(),
        'debug',
        `/api/v1/log/${category}?${qsObjectToString(qs)}`,
        JSON.stringify(data, null, ' '),
        ENV.LOG_ENV,
        new Date().toISOString(),
      ]
    );

    return formatResponse(data);
    // @ts-ignore
  } catch (error: Error) {
    let errorMessage = 'Something went wrong';
    const stackArray = error?.stack?.split('\n') || [];
    const stackInfo = stackArray.find((line: string) => line?.includes('.ts:'));
    if (error instanceof Error) {
      errorMessage = stackArray.length ? stackArray[0] + stackInfo : error.message;
    }
    return formatResponse({ error: errorMessage }, 500);
  }
}
