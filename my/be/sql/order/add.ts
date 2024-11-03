"use server";

import { OrderRow } from "./types";
import { sqlQuery } from "../sqlQuery";
import { pool } from "../pool/events";
import { cc } from "../../cc";

export const orderAdd = async function (row: OrderRow) {
  "use server";
  const dev = process.env.NODE_ENV === "development";
  const server_name = process.env.SERVER_NAME || "";
  const app_name = process.env.APP_NAME || "";
  try {
    const sql = "INSERT INTO v1.orders (type, ticker, side, size, price, server_name, app_name, dev, time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
    return await sqlQuery(pool, sql, [row.type, row.ticker, row.side, row.price, row.size, server_name, app_name, dev, Date.now()]);

    //@ts-ignore
  } catch (e: Error) {
    const error = {
      name: "Error order/add.ts catch",
      message: e.message,
      stack: e.stack,
    };
    cc.error(error.name, error);
  }
};
