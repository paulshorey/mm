import assert from "node:assert/strict";
import test from "node:test";

process.env.TIMESCALE_DB_URL ??= "postgres://test:test@localhost:5432/test";

const { Tbbo1mAggregator } = await import("./tbbo-1m-aggregator.js");

test("flushCompleted retries queued hourly writes during idle periods", async () => {
  let flushCompletedCalls = 0;

  const aggregator = new Tbbo1mAggregator({
    queryable: {
      query: async <Row = unknown>() => ({ rows: [] as Row[] }),
    },
    writeCandlesFn: async () => {},
    hourlyAggregator: {
      initialize: async () => {},
      addBaseCandles: async () => 0,
      flushCompleted: async () => {
        flushCompletedCalls++;
      },
      flushAll: async () => {},
    },
  });

  await aggregator.flushCompleted();

  assert.equal(flushCompletedCalls, 1);
});

test("keeps committed 1m writes even when hourly aggregation fails", async () => {
  let oneMinuteWrites = 0;
  let hourlyAddCalls = 0;

  const aggregator = new Tbbo1mAggregator({
    queryable: {
      query: async <Row = unknown>() => ({ rows: [] as Row[] }),
    },
    writeCandlesFn: async () => {
      oneMinuteWrites++;
    },
    hourlyAggregator: {
      initialize: async () => {},
      addBaseCandles: async () => {
        hourlyAddCalls++;
        throw new Error("hourly catch-up failed");
      },
      flushCompleted: async () => {},
      flushAll: async () => {},
    },
  });

  const success = await (aggregator as unknown as { writeBatch: (batch: unknown[]) => Promise<boolean> }).writeBatch([
    {
      key: "ES|2026-03-10T14:00:00.000Z",
      ticker: "ES",
      time: "2026-03-10T14:00:00.000Z",
      candle: {
        open: 6000,
        high: 6000,
        low: 6000,
        close: 6000,
        volume: 1,
        askVolume: 1,
        bidVolume: 0,
        unknownSideVolume: 0,
        sumBidDepth: 1,
        sumAskDepth: 1,
        sumSpread: 0,
        sumMidPrice: 0,
        sumPriceVolume: 6000,
        maxTradeSize: 1,
        largeTradeCount: 0,
        largeTradeVolume: 0,
        tradeCount: 1,
        symbol: "ESH6",
        currentCvd: 1,
        metricsOHLC: {
          cvd: {
            open: 1,
            high: 1,
            low: 1,
            close: 1,
          },
        },
      },
    },
  ]);

  assert.equal(success, true);
  assert.equal(oneMinuteWrites, 1);
  assert.equal(hourlyAddCalls, 1);
});
