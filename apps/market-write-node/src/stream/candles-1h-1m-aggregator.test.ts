import assert from "node:assert/strict";
import test from "node:test";

import type { CandleForDb, StoredCandleRow } from "../lib/trade/index.js";
import { candleForDbFromStoredRow } from "../lib/trade/index.js";

process.env.TIMESCALE_URL ??= "postgres://test:test@localhost:5432/test";

const { Candles1h1mAggregator } = await import("./candles-1h-1m-aggregator.js");

const BASE_TIME_MS = Date.parse("2026-03-10T14:00:00.000Z");

function minuteIso(offset: number): string {
  return new Date(BASE_TIME_MS + offset * 60_000).toISOString();
}

function makeStoredRow(offset: number): StoredCandleRow {
  const time = minuteIso(offset);
  const price = 6000 + offset;
  const cvd = offset + 1;

  return {
    time,
    ticker: "ES",
    symbol: "ESH6",
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 1,
    ask_volume: 1,
    bid_volume: 0,
    cvd_open: cvd,
    cvd_high: cvd,
    cvd_low: cvd,
    cvd_close: cvd,
    trades: 1,
    max_trade_size: 1,
    big_trades: 0,
    big_volume: 0,
    vd: 1,
    vd_ratio: 1,
    book_imbalance: 0,
    price_pct: 0,
    divergence: 0,
    sum_bid_depth: 10,
    sum_ask_depth: 10,
    sum_price_volume: price,
    unknown_volume: 0,
  };
}

function makeBaseCandle(offset: number): CandleForDb {
  return candleForDbFromStoredRow(makeStoredRow(offset));
}

test("requeues hourly candles after transient write failure", async () => {
  const seedRows = Array.from({ length: 60 }, (_, i) => makeStoredRow(i));
  const writtenTimes: string[] = [];
  let shouldFailWrite = true;
  let hydrationQueries = 0;

  const aggregator = new Candles1h1mAggregator({
    queryable: {
      query: async <Row = unknown>(_text: string, _values?: unknown[]) => {
        hydrationQueries++;
        return { rows: seedRows as Row[] };
      },
    },
    writeCandlesFn: async (_queryable, _tableName, candles) => {
      if (shouldFailWrite) {
        shouldFailWrite = false;
        throw new Error("temporary write failure");
      }

      writtenTimes.push(...candles.map((candle) => candle.time));
    },
  });

  await aggregator.initialize();
  assert.equal(aggregator.addBaseCandles([makeBaseCandle(60)]), 1);

  await aggregator.flushCompleted();
  assert.deepEqual(writtenTimes, []);

  await aggregator.flushCompleted();
  assert.deepEqual(writtenTimes, [minuteIso(60)]);
  assert.equal(aggregator.getCandlesWritten(), 1);
  assert.equal(hydrationQueries, 1);
});

test("retries startup hydration and replays buffered base candles", async () => {
  const seedRows = Array.from({ length: 60 }, (_, i) => makeStoredRow(i));
  const writtenTimes: string[] = [];
  let hydrationQueries = 0;

  const aggregator = new Candles1h1mAggregator({
    queryable: {
      query: async <Row = unknown>(_text: string, _values?: unknown[]) => {
        hydrationQueries++;
        if (hydrationQueries === 1) {
          throw new Error("temporary startup hydration failure");
        }

        return { rows: seedRows as Row[] };
      },
    },
    writeCandlesFn: async (_queryable, _tableName, candles) => {
      writtenTimes.push(...candles.map((candle) => candle.time));
    },
  });

  await aggregator.initialize();
  assert.equal(aggregator.addBaseCandles([makeBaseCandle(60)]), 1);

  await aggregator.flushCompleted();
  assert.equal(hydrationQueries, 2);
  assert.deepEqual(writtenTimes, [minuteIso(60)]);
  assert.equal(aggregator.getCandlesWritten(), 1);
});
