import { pool } from "../lib/db.js";
import type { CandleForDb, StoredCandleRow } from "../lib/trade/index.js";
import { RollingCandleWindow, candleForDbFromStoredRow, isMinuteBoundary, writeCandles } from "../lib/trade/index.js";

const SOURCE_TABLE = "candles_1m_1s";
const TARGET_TABLE = "candles_1h_1m";
const HYDRATION_WINDOW_ROWS = 60;
const WINDOW_MINUTES = 60;
const WRITE_BATCH_SIZE = 500;
const HYDRATION_RETRY_LOG_INTERVAL_MS = 30_000;

const SOURCE_COLUMNS = `
  time,
  ticker,
  symbol,
  open,
  high,
  low,
  close,
  volume,
  ask_volume,
  bid_volume,
  cvd_open,
  cvd_high,
  cvd_low,
  cvd_close,
  trades,
  max_trade_size,
  big_trades,
  big_volume,
  vd,
  vd_ratio,
  book_imbalance,
  price_pct,
  divergence,
  sum_bid_depth,
  sum_ask_depth,
  sum_price_volume,
  unknown_volume
`;

const SOURCE_COLUMNS_FROM_SOURCE_TABLE = `
  ${SOURCE_TABLE}.time,
  ${SOURCE_TABLE}.ticker,
  ${SOURCE_TABLE}.symbol,
  ${SOURCE_TABLE}.open,
  ${SOURCE_TABLE}.high,
  ${SOURCE_TABLE}.low,
  ${SOURCE_TABLE}.close,
  ${SOURCE_TABLE}.volume,
  ${SOURCE_TABLE}.ask_volume,
  ${SOURCE_TABLE}.bid_volume,
  ${SOURCE_TABLE}.cvd_open,
  ${SOURCE_TABLE}.cvd_high,
  ${SOURCE_TABLE}.cvd_low,
  ${SOURCE_TABLE}.cvd_close,
  ${SOURCE_TABLE}.trades,
  ${SOURCE_TABLE}.max_trade_size,
  ${SOURCE_TABLE}.big_trades,
  ${SOURCE_TABLE}.big_volume,
  ${SOURCE_TABLE}.vd,
  ${SOURCE_TABLE}.vd_ratio,
  ${SOURCE_TABLE}.book_imbalance,
  ${SOURCE_TABLE}.price_pct,
  ${SOURCE_TABLE}.divergence,
  ${SOURCE_TABLE}.sum_bid_depth,
  ${SOURCE_TABLE}.sum_ask_depth,
  ${SOURCE_TABLE}.sum_price_volume,
  ${SOURCE_TABLE}.unknown_volume
`;

const HYDRATION_QUERY = `
  WITH ranked AS (
    SELECT
      ${SOURCE_COLUMNS},
      ROW_NUMBER() OVER (PARTITION BY ticker ORDER BY time DESC) AS rn
    FROM ${SOURCE_TABLE}
    WHERE time = date_trunc('minute', time)
  )
  SELECT
    ${SOURCE_COLUMNS}
  FROM ranked
  WHERE rn <= $1
  ORDER BY ticker ASC, time ASC
`;

const LATEST_TARGET_TIMES_QUERY = `
  SELECT
    ticker,
    MAX(time) AS latest_target_time
  FROM ${TARGET_TABLE}
  GROUP BY ticker
`;

interface QueryResultLike<Row> {
  rows: Row[];
}

interface Queryable {
  query: <Row = unknown>(text: string, values?: unknown[]) => Promise<QueryResultLike<Row>>;
}

interface LatestTargetRow {
  ticker: string;
  latest_target_time: Date | string;
}

interface ReconciliationSourceRow extends StoredCandleRow {
  latest_target_time: Date | string;
}

interface Candles1h1mAggregatorOptions {
  queryable?: Queryable;
  writeCandlesFn?: typeof writeCandles;
}

export class Candles1h1mAggregator {
  private readonly queryable: Queryable;
  private readonly writeCandlesFn: typeof writeCandles;
  private readonly rollingWindow = new RollingCandleWindow({
    windowSize: WINDOW_MINUTES,
    expectedIntervalMs: 60_000,
    label: "1h@1m",
  });

  private initialized = false;
  private candlesWritten = 0;
  private bufferedBaseCandles: CandleForDb[] = [];
  private hydrationPromise: Promise<boolean> | null = null;
  private lastHydrationBlockedLogTime = 0;

  constructor(options: Candles1h1mAggregatorOptions = {}) {
    this.queryable = options.queryable ?? pool;
    this.writeCandlesFn = options.writeCandlesFn ?? writeCandles;
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  addBaseCandles(candles: CandleForDb[]): number {
    const minuteBoundaryCandles = candles.filter((candle) => isMinuteBoundary(candle.time));
    if (minuteBoundaryCandles.length === 0) {
      return 0;
    }

    if (!this.initialized) {
      this.bufferedBaseCandles.push(...minuteBoundaryCandles);
      return minuteBoundaryCandles.length;
    }

    return this.rollingWindow.addCandles(minuteBoundaryCandles);
  }

  async flushCompleted(): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      this.maybeLogHydrationBlocked();
      return;
    }

    await this.flushPendingCandles();
  }

  async flushAll(): Promise<void> {
    await this.flushCompleted();
  }

  getCandlesWritten(): number {
    return this.candlesWritten;
  }

  private async flushPendingCandles(): Promise<void> {
    const pendingCandles = this.rollingWindow.drainPendingCandles();
    if (pendingCandles.length === 0) {
      return;
    }

    let written = 0;
    let dropped = 0;
    const retryCandles: CandleForDb[] = [];

    for (let i = 0; i < pendingCandles.length; i += WRITE_BATCH_SIZE) {
      const batch = pendingCandles.slice(i, i + WRITE_BATCH_SIZE);

      try {
        await this.writeCandlesFn(this.queryable, TARGET_TABLE, batch);
        written += batch.length;
        this.candlesWritten += batch.length;
      } catch (error) {
        dropped += batch.length;
        retryCandles.push(...batch);
        console.error(`❌ Failed to write ${TARGET_TABLE} candles:`, error);
      }
    }

    if (retryCandles.length > 0) {
      this.rollingWindow.requeuePendingCandles(retryCandles);
    }

    if (written > 0) {
      console.log(`✅ Flushed ${written} rolling 1h candle(s) to ${TARGET_TABLE}`);
    }
    if (dropped > 0) {
      console.warn(`⚠️ Requeued ${dropped} rolling 1h candle(s) after DB write failures`);
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }

    this.hydrationPromise = this.hydrateFromDatabase().finally(() => {
      this.hydrationPromise = null;
    });
    return this.hydrationPromise;
  }

  private async hydrateFromDatabase(): Promise<boolean> {
    try {
      const latestTargetTimes = await this.loadLatestTargetTimes();
      const [recentSourceRows, reconciliationRows] = await Promise.all([
        this.queryable.query<StoredCandleRow>(HYDRATION_QUERY, [HYDRATION_WINDOW_ROWS]),
        this.loadReconciliationRows(latestTargetTimes),
      ]);

      const latestTargetTimeByTicker = new Map(latestTargetTimes.map((row) => [row.ticker, new Date(row.latest_target_time).getTime()]));
      const recentSeedCandles = recentSourceRows.rows
        .filter((row) => !latestTargetTimeByTicker.has(row.ticker))
        .map((row) => candleForDbFromStoredRow(row, { requireCompleteCvd: true }));

      const reconciliationSeedCandles: CandleForDb[] = [];
      const reconciliationReplayCandles: CandleForDb[] = [];
      for (const row of reconciliationRows) {
        const candle = candleForDbFromStoredRow(row, { requireCompleteCvd: true });
        const latestTargetTimeMs = new Date(row.latest_target_time).getTime();

        if (new Date(candle.time).getTime() <= latestTargetTimeMs) {
          reconciliationSeedCandles.push(candle);
          continue;
        }

        reconciliationReplayCandles.push(candle);
      }

      const seedCandles = [...recentSeedCandles, ...reconciliationSeedCandles];
      this.rollingWindow.seedCandles(seedCandles);
      const replayedFromSource = this.rollingWindow.addCandles(reconciliationReplayCandles);
      this.initialized = true;

      if (seedCandles.length > 0) {
        console.log(`📚 Hydrated ${seedCandles.length} canonical 1m row(s) into ${TARGET_TABLE}`);
      } else {
        console.log(`📚 No canonical 1m rows available yet to hydrate ${TARGET_TABLE}`);
      }
      if (replayedFromSource > 0) {
        console.log(`🔁 Replayed ${replayedFromSource} canonical 1m row(s) newer than ${TARGET_TABLE}`);
      }

      const replayed = this.replayBufferedBaseCandles();
      if (replayed > 0) {
        console.log(`📥 Replayed ${replayed} buffered canonical 1m row(s) into ${TARGET_TABLE}`);
      }

      await this.flushPendingCandles();

      return true;
    } catch (error) {
      console.warn(`⚠️ Could not hydrate ${TARGET_TABLE} from ${SOURCE_TABLE}; will retry:`, error);
      return false;
    }
  }

  private replayBufferedBaseCandles(): number {
    if (this.bufferedBaseCandles.length === 0) {
      return 0;
    }

    const buffered = this.bufferedBaseCandles;
    this.bufferedBaseCandles = [];
    return this.rollingWindow.addCandles(buffered);
  }

  private async loadLatestTargetTimes(): Promise<LatestTargetRow[]> {
    const result = await this.queryable.query<LatestTargetRow>(LATEST_TARGET_TIMES_QUERY);
    return result.rows;
  }

  private async loadReconciliationRows(latestTargetTimes: LatestTargetRow[]): Promise<ReconciliationSourceRow[]> {
    if (latestTargetTimes.length === 0) {
      return [];
    }

    const values: string[] = [];
    const placeholders = latestTargetTimes.map((row, index) => {
      const offset = index * 2;
      values.push(row.ticker, row.latest_target_time instanceof Date ? row.latest_target_time.toISOString() : row.latest_target_time);
      return `($${offset + 1}, $${offset + 2}::timestamptz)`;
    });

    const query = `
      WITH latest_target(ticker, latest_target_time) AS (
        VALUES ${placeholders.join(", ")}
      )
      SELECT
        ${SOURCE_COLUMNS_FROM_SOURCE_TABLE},
        latest_target.latest_target_time
      FROM ${SOURCE_TABLE}
      JOIN latest_target
        ON latest_target.ticker = ${SOURCE_TABLE}.ticker
      WHERE time = date_trunc('minute', time)
        AND time >= latest_target.latest_target_time - INTERVAL '${WINDOW_MINUTES - 1} minutes'
      ORDER BY ${SOURCE_TABLE}.ticker ASC, ${SOURCE_TABLE}.time ASC
    `;

    const result = await this.queryable.query<ReconciliationSourceRow>(query, values);
    return result.rows;
  }

  private maybeLogHydrationBlocked(): void {
    const now = Date.now();
    if (now - this.lastHydrationBlockedLogTime < HYDRATION_RETRY_LOG_INTERVAL_MS) {
      return;
    }

    console.warn(
      `⚠️ ${TARGET_TABLE} is still waiting on startup hydration; ` +
        `buffered ${this.bufferedBaseCandles.length} minute-boundary base candle(s) for retry`,
    );
    this.lastHydrationBlockedLogTime = now;
  }
}
