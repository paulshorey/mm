export type OrderRow = {
  type: "MARKET" | "LIMIT" | "STOP_MARKET";
  ticker: string;
  side: "LONG" | "SHORT";
  size: number;
  price: number;
};
