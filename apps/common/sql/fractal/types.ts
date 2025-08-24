export type FractalRowGet = {
  id: number;
  ticker: string;
  interval: string;
  time: Date; // DateTime as ISO string
  timenow: Date; // DateTime as ISO string
  close: number;
  volume: number;
  average_strength: number;
  volume_strength: number;
  price_strength: number;
  price_volume_strength: number;
  volume_strength_ma: number;
  price_strength_ma: number;
  price_volume_strength_ma: number;
  server_name: string;
  app_name: string;
  node_env: string;
  created_at: Date; // DateTime as ISO string
};

export type FractalRowAdd = {
  ticker: string;
  interval: string;
  time: Date;
  timenow: Date;
  close?: number;
  volume?: number;
  average_strength?: number;
  volume_strength?: number;
  price_strength?: number;
  price_volume_strength?: number;
  volume_strength_ma?: number;
  price_strength_ma?: number;
  price_volume_strength_ma?: number;
  server_name?: string;
  app_name?: string;
  node_env?: string;
};
