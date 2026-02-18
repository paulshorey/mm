import type { Request } from "express";
import type { LogRowAdd } from "@lib/db-postgres/sql/log/types";
import { getCurrentIpAddress } from "@lib/common/nextjs/getCurrentIpAddress";
import { sendToMyselfSMS } from "@lib/common/twillio/sendToMyselfSMS";

type SqlLogAdd = (row: LogRowAdd) => Promise<unknown>;

export const logRequestEvent = async (args: { req: Request; row: LogRowAdd; sqlLogAdd: SqlLogAdd; sendSms?: boolean }) => {
  const { req, row, sqlLogAdd, sendSms = false } = args;
  const addr = await getCurrentIpAddress({
    getHeader: (name: string) => req.get(name) ?? undefined,
    ip: req.ip,
  });

  await sqlLogAdd({
    ...row,
    stack: {
      ...row.stack,
      ...addr,
    },
  });

  if (sendSms) {
    await sendToMyselfSMS(row.message);
  }
};
