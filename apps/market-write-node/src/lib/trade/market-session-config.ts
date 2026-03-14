import type { MarketSessionConfig } from "./market-session.js";

export const MARKET_SESSION_TIME_ZONE_ENV_VAR = "MARKET_SESSION_TIME_ZONE";
export const MARKET_SESSION_OPEN_WINDOWS_ENV_VAR = "MARKET_SESSION_OPEN_WINDOWS";

/**
 * Default session profile for CME Globex-style futures traded in Chicago time.
 *
 * This remains intentionally simple for now: recurring weekly open windows
 * without holiday overrides. Future profiles can be added here incrementally.
 */
export const DEFAULT_GLOBEX_MARKET_SESSION_CONFIG: MarketSessionConfig = {
  timeZone: "America/Chicago",
  weeklyLocalWindows: [
    { startDay: "Sun", startTime: "17:00", endDay: "Mon", endTime: "16:00" },
    { startDay: "Mon", startTime: "17:00", endDay: "Tue", endTime: "16:00" },
    { startDay: "Tue", startTime: "17:00", endDay: "Wed", endTime: "16:00" },
    { startDay: "Wed", startTime: "17:00", endDay: "Thu", endTime: "16:00" },
    { startDay: "Thu", startTime: "17:00", endDay: "Fri", endTime: "16:00" },
  ],
  label: "CME Globex",
};

export const DEFAULT_MARKET_SESSION_CONFIG = DEFAULT_GLOBEX_MARKET_SESSION_CONFIG;
