import { sqlLogAdd } from "@lib/db-trading/sql/log/add";
import { sendToMyselfSMS } from "@lib/common/twillio/sendToMyselfSMS";

import type { WritePipelineHealthReport } from "./write-pipeline-health.js";

export const HOURLY_LAG_REMEDIATION_MESSAGE =
  "write-next automatic self-restart / remediation because hourly lag unhealthy";

type SqlLogAddFn = typeof sqlLogAdd;
type SendToMyselfSmsFn = typeof sendToMyselfSMS;

export interface HourlyLagRemediationState {
  unhealthyLagSinceMs: number | null;
  remediationInProgress: boolean;
}

export interface HourlyLagRemediationDecision extends HourlyLagRemediationState {
  shouldRemediate: boolean;
  unhealthyLagDurationMs: number;
}

export interface EvaluateHourlyLagRemediationArgs extends HourlyLagRemediationState {
  report: WritePipelineHealthReport;
  nowMs: number;
  remediationAfterMs: number;
}

export interface NotifyHourlyLagRemediationArgs {
  report: WritePipelineHealthReport;
  unhealthyLagSinceMs: number;
  nowMs?: number;
  sqlLogAddFn?: SqlLogAddFn;
  sendToMyselfSmsFn?: SendToMyselfSmsFn;
}

function isHourlyLagUnhealthy(report: WritePipelineHealthReport): boolean {
  return report.status === "unhealthy" && report.lag.staleTickers.length > 0;
}

export function evaluateHourlyLagRemediation({
  report,
  nowMs,
  remediationAfterMs,
  unhealthyLagSinceMs,
  remediationInProgress,
}: EvaluateHourlyLagRemediationArgs): HourlyLagRemediationDecision {
  if (remediationInProgress) {
    return {
      unhealthyLagSinceMs,
      remediationInProgress,
      shouldRemediate: false,
      unhealthyLagDurationMs: unhealthyLagSinceMs === null ? 0 : Math.max(0, nowMs - unhealthyLagSinceMs),
    };
  }

  if (!isHourlyLagUnhealthy(report)) {
    return {
      unhealthyLagSinceMs: null,
      remediationInProgress: false,
      shouldRemediate: false,
      unhealthyLagDurationMs: 0,
    };
  }

  const nextUnhealthyLagSinceMs = unhealthyLagSinceMs ?? nowMs;
  const unhealthyLagDurationMs = Math.max(0, nowMs - nextUnhealthyLagSinceMs);
  const shouldRemediate = unhealthyLagDurationMs >= remediationAfterMs;

  return {
    unhealthyLagSinceMs: nextUnhealthyLagSinceMs,
    remediationInProgress: shouldRemediate,
    shouldRemediate,
    unhealthyLagDurationMs,
  };
}

export async function notifyHourlyLagRemediation({
  report,
  unhealthyLagSinceMs,
  nowMs = Date.now(),
  sqlLogAddFn = sqlLogAdd,
  sendToMyselfSmsFn = sendToMyselfSMS,
}: NotifyHourlyLagRemediationArgs): Promise<void> {
  const debuggingData = {
    category: "write-node-health",
    tag: "hourly-lag-remediation",
    checkedAt: report.checkedAt,
    reasons: report.reasons,
    staleTickers: report.lag.staleTickers,
    unhealthyLagSince: new Date(unhealthyLagSinceMs).toISOString(),
    unhealthyLagDurationMs: Math.max(0, nowMs - unhealthyLagSinceMs),
    stream: report.stream,
    lag: report.lag,
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
  };

  try {
    await sqlLogAddFn({
      name: "error",
      message: HOURLY_LAG_REMEDIATION_MESSAGE,
      stack: debuggingData,
    });
  } catch (error) {
    console.error("Failed to log hourly lag remediation event:", error);
  }

  try {
    await sendToMyselfSmsFn(HOURLY_LAG_REMEDIATION_MESSAGE);
  } catch (error) {
    console.error("Failed to send hourly lag remediation SMS:", error);
  }
}
