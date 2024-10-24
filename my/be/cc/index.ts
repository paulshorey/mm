import { add } from "../sql/log/add";

export const cc = {
  log: function (...args: any[]) {
    // const args = Array.from(arguments);
    const message = args.shift();
    add(args, { type: "log", message });
  },
  info: function (...args: any[]) {
    // const args = Array.from(arguments);
    const message = args.shift();
    add(args, { type: "info", message });
  },
  warn: function (...args: any[]) {
    // const args = Array.from(arguments);
    const message = args.shift();
    add(args, { type: "warn", message });
  },
  error: function (...args: any[]) {
    // const args = Array.from(arguments);
    const message = args.shift();
    add(args, { type: "error", message });
  },
};
