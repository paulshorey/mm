import "dotenv/config";
import cors from "cors";
import express from "express";
import { formatResponse } from "./lib/http.js";
import { Router } from "express";
import { getTradingView } from "./api/strength/getTradingView.js";
import { postTradingView } from "./api/strength/postTradingView.js";

// APP
const app = express();
const port = Number(process.env.PORT) || 3000;
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "*/*" }));

// ENDPOINTS
app.get("/health", (_req, res) => {
  formatResponse(res, { ok: true });
});
const tradingViewRouter = Router();
tradingViewRouter.get("/", getTradingView);
tradingViewRouter.post("/", postTradingView);
app.use("/api/v1/tradingview", tradingViewRouter);

// START
app.listen(port, "::", () => {
  console.log(`TradingView API server running on port ${port}`);
});
