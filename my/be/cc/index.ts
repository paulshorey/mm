import { logAdd } from "../sql/log/add";
import { consoleAction } from "./lib/consoleAction";

/**
 * A logging utility for both server-side and client-side operations.
 *
 * The `cc` object (short for "cloud console") provides a set of methods for
 * logging messages at different levels (log, info, warn, error). It wraps
 * the `consoleAction` for immediate feedback in the console and `logAdd`
 * to persist logs to the database.
 *
 * The `warn` and `error` levels are configured to trigger an SMS notification
 * in addition to database logging, providing immediate alerts for critical issues.
 */
export const cc = {
  // @ts-ignore
  no: async function (message: string, data?: any, options: Record<string, any> = {}) {},
  log: async function (message: string, data?: any, options: Record<string, any> = {}) {
    try {
      consoleAction("log", message, data);
      // await logAdd("log", message, data);
    } catch (e) {
      console.error(e);
    }
  },
  info: async function (message: string, data?: any, options: Record<string, any> = {}) {
    try {
      consoleAction("info", message, data);
      await logAdd({ name: "info", message, stack: data, ...options });
    } catch (e) {
      console.error(e);
    }
  },
  warn: async function (message: string, data?: any, options: Record<string, any> = {}) {
    try {
      consoleAction("warn", message, data);
      await logAdd({ name: "warn", message, stack: data, sms: true, ...options });
    } catch (e) {
      console.error(e);
    }
  },
  error: async function (message: string, data?: any, options: Record<string, any> = {}) {
    try {
      consoleAction("error", message, data);
      await logAdd({ name: "error", message, stack: data, sms: true, ...options });
    } catch (e) {
      console.error(e);
    }
  },
};
