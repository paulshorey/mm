export type MomentumRowGet = {
  id: number;
  ticker: string;
  interval: number;
  time: string; // DateTime as ISO string
  timenow: string; // DateTime as ISO string
  volumeStrength: number;
  priceMovement: number;
  priceMovementMa: number;
  server_name: string;
  app_name: string;
  node_env: string;
  created_at: string; // DateTime as ISO string
};

export type MomentumRowAdd = {
  ticker: string;
  interval: number;
  time: Date;
  timenow: Date;
  volumeStrength: number;
  priceMovement: number;
  priceMovementMa: number;
  server_name?: string;
  app_name?: string;
  node_env?: string;
};
