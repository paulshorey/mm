export type FractalRowGet = {
  id: number;
  ticker: string;
  interval: string;
  time: Date; // DateTime as ISO string
  timenow: Date; // DateTime as ISO string
  close: number;
  volume: number;
  strength: number;
  // volume_strength: number;
  // price_strength: number;
  // price_volume_strength: number;
  // volume_strength_ma: number;
  // price_strength_ma: number;
  // price_volume_strength_ma: number;
  server_name: string;
  app_name: string;
  node_env: string;
  created_at: Date; // DateTime as ISO string
};

export type FractalRowAdd = {
  ticker: string | null;
  interval: string | null;
  time: Date | null;
  timenow: Date | null;
  close: number | null;
  volume: number | null;
  average_strength: number | null;
  volume_strength: number | null;
  price_strength: number | null;
  price_volume_strength: number | null;
  volume_strength_ma: number | null;
  price_strength_ma: number | null;
  price_volume_strength_ma: number | null;
  server_name: string | null;
  app_name: string | null;
  node_env: string | null;
};
