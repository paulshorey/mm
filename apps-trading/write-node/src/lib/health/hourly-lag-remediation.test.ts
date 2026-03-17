import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateHourlyLagRemediation,
  HOURLY_LAG_REMEDIATION_MESSAGE,
  notifyHourlyLagRemediation,
} from "./hourly-lag-remediation.js";
import type { WritePipelineHealthReport } from "./write-pipeline-health.js";

function makeReport(overrides: Partial<WritePipelineHealthReport> = {}): WritePipelineHealthReport {
  return {
    ok: false,
    status: "unhealthy",
    checkedAt: "2026-03-17T19:00:00.000Z",
    reasons: ["candles_1h_1m is stale for: ES"],
    stream: {
      connected: true,
      authenticated: true,
      streaming: true,
      reconnectAttempts: 0,
      marketOpen: true,
      marketOpenByTicker: { ES: true },
      messagesReceived: 100,
      parseErrors: 0,
      skippedMarketClosed: 0,
      startupGraceActive: false,
      processUptimeSeconds: 600,
    },
    lag: {
      maxAllowedLagMinutes: 2,
      tickers: [
        {
          ticker: "ES",
          marketOpen: true,
          status: "stale",
          latestSourceTime: "2026-03-17T18:59:00.000Z",
          latestTargetTime: "2026-03-17T18:50:00.000Z",
          latestSourceRowCount: 60,
          lagMinutes: 9,
        },
      ],
      staleTickers: ["ES"],
      warmingUpTickers: [],
    },
    ...overrides,
  };
}

test("starts tracking persisted unhealthy hourly lag before remediation", () => {
  const nowMs = Date.parse("2026-03-17T19:00:00.000Z");
  const decision = evaluateHourlyLagRemediation({
    report: makeReport(),
    nowMs,
    remediationAfterMs: 180_000,
    unhealthyLagSinceMs: null,
    remediationInProgress: false,
  });

  assert.equal(decision.shouldRemediate, false);
  assert.equal(decision.unhealthyLagSinceMs, nowMs);
  assert.equal(decision.remediationInProgress, false);
  assert.equal(decision.unhealthyLagDurationMs, 0);
});

test("triggers remediation once unhealthy lag persists past threshold", () => {
  const unhealthyLagSinceMs = Date.parse("2026-03-17T18:56:00.000Z");
  const nowMs = Date.parse("2026-03-17T19:00:00.000Z");
  const decision = evaluateHourlyLagRemediation({
    report: makeReport(),
    nowMs,
    remediationAfterMs: 180_000,
    unhealthyLagSinceMs,
    remediationInProgress: false,
  });

  assert.equal(decision.shouldRemediate, true);
  assert.equal(decision.remediationInProgress, true);
  assert.equal(decision.unhealthyLagDurationMs, 240_000);
});

test("resets remediation tracking after hourly lag recovers", () => {
  const decision = evaluateHourlyLagRemediation({
    report: makeReport({
      ok: true,
      status: "ok",
      reasons: [],
      lag: {
        maxAllowedLagMinutes: 2,
        tickers: [],
        staleTickers: [],
        warmingUpTickers: [],
      },
    }),
    nowMs: Date.parse("2026-03-17T19:00:00.000Z"),
    remediationAfterMs: 180_000,
    unhealthyLagSinceMs: Date.parse("2026-03-17T18:56:00.000Z"),
    remediationInProgress: false,
  });

  assert.equal(decision.shouldRemediate, false);
  assert.equal(decision.unhealthyLagSinceMs, null);
  assert.equal(decision.remediationInProgress, false);
});

test("notifies DB log and SMS with the remediation message", async () => {
  let loggedRow: Record<string, unknown> | null = null;
  let smsMessage = "";

  await notifyHourlyLagRemediation({
    report: makeReport(),
    unhealthyLagSinceMs: Date.parse("2026-03-17T18:56:00.000Z"),
    nowMs: Date.parse("2026-03-17T19:00:00.000Z"),
    sqlLogAddFn: async (row) => {
      loggedRow = row as unknown as Record<string, unknown>;
      return null;
    },
    sendToMyselfSmsFn: async (message) => {
      smsMessage = message;
      return true;
    },
  });

  assert.ok(loggedRow);
  const persistedRow = loggedRow as Record<string, unknown>;
  assert.equal(persistedRow.message, HOURLY_LAG_REMEDIATION_MESSAGE);
  assert.equal(persistedRow.name, "error");
  assert.equal(smsMessage, HOURLY_LAG_REMEDIATION_MESSAGE);
  assert.deepEqual((persistedRow.stack as Record<string, unknown>).staleTickers, ["ES"]);
});

test("still attempts SMS when DB logging fails", async () => {
  let smsMessage = "";

  await notifyHourlyLagRemediation({
    report: makeReport(),
    unhealthyLagSinceMs: Date.parse("2026-03-17T18:56:00.000Z"),
    sqlLogAddFn: async () => {
      throw new Error("log failed");
    },
    sendToMyselfSmsFn: async (message) => {
      smsMessage = message;
      return true;
    },
  });

  assert.equal(smsMessage, HOURLY_LAG_REMEDIATION_MESSAGE);
});
