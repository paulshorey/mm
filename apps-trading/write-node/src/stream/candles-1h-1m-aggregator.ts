import { pool } from "../lib/db.js";
import type { CandleForDb, StoredCandleRow } from "../lib/trade/index.js";
import { RollingCandleWindow, candleForDbFromStoredRow, isMinuteBoundary, writeCandles } from "../lib/trade/index.js";

const SOURCE_TABLE = "candles_1m_1s";
const TARGET_TABLE = "candles_1h_1m";
const HYDRATION_WINDOW_ROWS = 60;
const WINDOW_MINUTES = 60;
const WRITE_BATCH_SIZE = 500;
const HYDRATION_RETRY_LOG_INTERVAL_MS = 30_000;
const RUNTIME_RECONCILIATION_INTERVAL_MS = 10_000;
const RECONCILIATION_PAGE_SIZE = 5_000;
const RECONCILIATION_FLUSH_THRESHOLD = 10_000;

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
  SELECT DISTINCT ON (ticker)
    ticker,
    time AS latest_target_time
  FROM ${TARGET_TABLE}
  ORDER BY ticker ASC, time DESC
`;

const LATEST_SOURCE_TIMES_QUERY = `
  SELECT DISTINCT ON (ticker)
    ticker,
    time AS latest_source_time
  FROM ${SOURCE_TABLE}
  WHERE time = date_trunc('minute', time)
  ORDER BY ticker ASC, time DESC
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

interface LatestSourceRow {
  ticker: string;
  latest_source_time: Date | string;
}

type ReconciliationSourceRow = StoredCandleRow & {
  latest_target_time: Date | string;
};

interface SourceCatchupRange {
  ticker: string;
  start_exclusive_time: string;
  end_inclusive_time: string;
}

interface ReconciliationCursor {
  ticker: string;
  time: string;
}

interface ReconciliationResult {
  seeded: number;
  replayed: number;
}

interface Candles1h1mAggregatorOptions {
  queryable?: Queryable;
  writeCandlesFn?: typeof writeCandles;
}

export class Candles1h1mAggregator {
  private readonly queryable: Queryable;
  private readonly writeCandlesFn: typeof writeCandles;
  private rollingWindow = this.createRollingWindow();

  private initialized = false;
  private candlesWritten = 0;
  private bufferedBaseCandles: CandleForDb[] = [];
  private hydrationPromise: Promise<boolean> | null = null;
  private runtimeReconciliationPromise: Promise<number> | null = null;
  private lastHydrationBlockedLogTime = 0;
  private lastRuntimeReconciliationTime = 0;
  private readonly lastSourceTimeByTicker = new Map<string, string>();

  constructor(options: Candles1h1mAggregatorOptions = {}) {
    this.queryable = options.queryable ?? pool;
    this.writeCandlesFn = options.writeCandlesFn ?? writeCandles;
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  async addBaseCandles(candles: CandleForDb[]): Promise<number> {
    const minuteBoundaryCandles = candles.filter((candle) => isMinuteBoundary(candle.time));
    if (minuteBoundaryCandles.length === 0) {
      return 0;
    }

    if (!this.initialized) {
      this.bufferedBaseCandles.push(...minuteBoundaryCandles);
      return minuteBoundaryCandles.length;
    }

    await this.catchUpBeforeIncomingCandles(minuteBoundaryCandles);
    const accepted = this.rollingWindow.addCandles(minuteBoundaryCandles);
    this.recordSourceCandles(minuteBoundaryCandles);
    return accepted;
  }

  async flushCompleted(): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      this.maybeLogHydrationBlocked();
      return;
    }

    await this.maybeReconcileRuntimeLag();
    await this.flushPendingCandles();
  }

  async flushAll(): Promise<void> {
    await this.flushCompleted();
  }

  getCandlesWritten(): number {
    return this.candlesWritten;
  }

  private createRollingWindow(): RollingCandleWindow {
    return new RollingCandleWindow({
      windowSize: WINDOW_MINUTES,
      expectedIntervalMs: 60_000,
      label: "1h@1m",
    });
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

  private recordSourceCandles(candles: CandleForDb[]): void {
    for (const candle of candles) {
      this.recordSourceTime(candle.ticker, candle.time);
    }
  }

  private recordSourceRows(rows: StoredCandleRow[]): void {
    for (const row of rows) {
      const time = row.time instanceof Date ? row.time.toISOString() : new Date(row.time).toISOString();
      this.recordSourceTime(row.ticker, time);
    }
  }

  private recordSourceTime(ticker: string, time: string): void {
    const current = this.lastSourceTimeByTicker.get(ticker);
    if (!current || time > current) {
      this.lastSourceTimeByTicker.set(ticker, time);
    }
  }

  private async catchUpBeforeIncomingCandles(candles: CandleForDb[]): Promise<void> {
    const ranges = this.buildCatchupRangesBeforeIncomingCandles(candles);
    if (ranges.length === 0) {
      return;
    }

    const rows = await this.loadSourceRowsInRanges(ranges);
    if (rows.length === 0) {
      return;
    }

    const sourceCandles = rows.map((row) => candleForDbFromStoredRow(row, { requireCompleteCvd: true }));
    this.rollingWindow.addCandles(sourceCandles);
    this.recordSourceRows(rows);
    console.log(`🔁 Replayed ${sourceCandles.length} canonical 1m row(s) ahead of live handoff into ${TARGET_TABLE}`);
  }

  private buildCatchupRangesBeforeIncomingCandles(candles: CandleForDb[]): SourceCatchupRange[] {
    const earliestTimeByTicker = new Map<string, string>();
    for (const candle of candles) {
      const current = earliestTimeByTicker.get(candle.ticker);
      if (!current || candle.time < current) {
        earliestTimeByTicker.set(candle.ticker, candle.time);
      }
    }

    const ranges: SourceCatchupRange[] = [];
    for (const [ticker, earliestIncomingTime] of earliestTimeByTicker) {
      const lastSourceTime = this.lastSourceTimeByTicker.get(ticker);
      if (!lastSourceTime) {
        continue;
      }

      const earliestIncomingMs = new Date(earliestIncomingTime).getTime();
      const endInclusiveMs = earliestIncomingMs - 60_000;
      if (endInclusiveMs <= new Date(lastSourceTime).getTime()) {
        continue;
      }

      ranges.push({
        ticker,
        start_exclusive_time: lastSourceTime,
        end_inclusive_time: new Date(endInclusiveMs).toISOString(),
      });
    }

    return ranges;
  }

  private async maybeReconcileRuntimeLag(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRuntimeReconciliationTime < RUNTIME_RECONCILIATION_INTERVAL_MS) {
      return;
    }

    if (this.runtimeReconciliationPromise) {
      await this.runtimeReconciliationPromise;
      return;
    }

    this.lastRuntimeReconciliationTime = now;
    this.runtimeReconciliationPromise = this.reconcileRuntimeLag().finally(() => {
      this.runtimeReconciliationPromise = null;
    });
    await this.runtimeReconciliationPromise;
  }

  private async reconcileRuntimeLag(): Promise<number> {
    const latestSourceTimes = await this.loadLatestSourceTimes();
    const ranges: SourceCatchupRange[] = [];

    for (const row of latestSourceTimes) {
      const latestSourceTime = row.latest_source_time instanceof Date ? row.latest_source_time.toISOString() : new Date(row.latest_source_time).toISOString();
      const lastSourceTime = this.lastSourceTimeByTicker.get(row.ticker);
      if (!lastSourceTime || latestSourceTime <= lastSourceTime) {
        continue;
      }

      ranges.push({
        ticker: row.ticker,
        start_exclusive_time: lastSourceTime,
        end_inclusive_time: latestSourceTime,
      });
    }

    if (ranges.length === 0) {
      return 0;
    }

    const rows = await this.loadSourceRowsInRanges(ranges);
    if (rows.length === 0) {
      return 0;
    }

    const sourceCandles = rows.map((row) => candleForDbFromStoredRow(row, { requireCompleteCvd: true }));
    const accepted = this.rollingWindow.addCandles(sourceCandles);
    this.recordSourceRows(rows);
    if (accepted > 0) {
      console.log(`🔁 Reconciled ${accepted} canonical 1m row(s) from ${SOURCE_TABLE} into ${TARGET_TABLE}`);
    }
    return accepted;
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
      this.rollingWindow = this.createRollingWindow();
      this.lastSourceTimeByTicker.clear();

      const latestTargetTimes = await this.loadLatestTargetTimes();
      const recentSourceRows = await this.queryable.query<StoredCandleRow>(HYDRATION_QUERY, [HYDRATION_WINDOW_ROWS]);

      const latestTargetTimeByTicker = new Map(latestTargetTimes.map((row) => [row.ticker, new Date(row.latest_target_time).getTime()]));
      const recentSeedCandles = recentSourceRows.rows
        .filter((row) => !latestTargetTimeByTicker.has(row.ticker))
        .map((row) => candleForDbFromStoredRow(row, { requireCompleteCvd: true }));
      const reconciliation = await this.reconcileFromSource(latestTargetTimes);
      const seedCandles = [...recentSeedCandles];
      this.rollingWindow.seedCandles(seedCandles);
      this.recordSourceCandles(seedCandles);

      const totalSeeded = seedCandles.length + reconciliation.seeded;
      if (totalSeeded > 0) {
        console.log(`📚 Hydrated ${totalSeeded} canonical 1m row(s) into ${TARGET_TABLE}`);
      } else {
        console.log(`📚 No canonical 1m rows available yet to hydrate ${TARGET_TABLE}`);
      }
      if (reconciliation.replayed > 0) {
        console.log(`🔁 Replayed ${reconciliation.replayed} canonical 1m row(s) newer than ${TARGET_TABLE}`);
      }

      const replayed = this.replayBufferedBaseCandles();
      if (replayed > 0) {
        console.log(`📥 Replayed ${replayed} buffered canonical 1m row(s) into ${TARGET_TABLE}`);
      }

      this.initialized = true;
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
    const accepted = this.rollingWindow.addCandles(buffered);
    this.recordSourceCandles(buffered);
    return accepted;
  }

  private async loadLatestTargetTimes(): Promise<LatestTargetRow[]> {
    const result = await this.queryable.query<LatestTargetRow>(LATEST_TARGET_TIMES_QUERY);
    return result.rows;
  }

  private async loadLatestSourceTimes(): Promise<LatestSourceRow[]> {
    const result = await this.queryable.query<LatestSourceRow>(LATEST_SOURCE_TIMES_QUERY);
    return result.rows;
  }

  private async reconcileFromSource(latestTargetTimes: LatestTargetRow[]): Promise<ReconciliationResult> {
    if (latestTargetTimes.length === 0) {
      return { seeded: 0, replayed: 0 };
    }

    let cursor: ReconciliationCursor | null = null;
    let seeded = 0;
    let replayed = 0;

    while (true) {
      const rows = await this.loadReconciliationRows(latestTargetTimes, cursor);
      if (rows.length === 0) {
        break;
      }

      const reconciliationSeedCandles: CandleForDb[] = [];
      const reconciliationReplayCandles: CandleForDb[] = [];
      for (const row of rows) {
        const candle = candleForDbFromStoredRow(row, { requireCompleteCvd: true });
        const latestTargetTimeMs = new Date(row.latest_target_time).getTime();

        if (new Date(candle.time).getTime() <= latestTargetTimeMs) {
          reconciliationSeedCandles.push(candle);
        } else {
          reconciliationReplayCandles.push(candle);
        }
      }

      if (reconciliationSeedCandles.length > 0) {
        seeded += reconciliationSeedCandles.length;
        this.rollingWindow.seedCandles(reconciliationSeedCandles);
        this.recordSourceCandles(reconciliationSeedCandles);
      }
      if (reconciliationReplayCandles.length > 0) {
        replayed += this.rollingWindow.addCandles(reconciliationReplayCandles);
        this.recordSourceCandles(reconciliationReplayCandles);
      }
      if (this.rollingWindow.getStats().pendingCandles >= RECONCILIATION_FLUSH_THRESHOLD) {
        await this.flushPendingCandles();
      }

      const lastRow = rows[rows.length - 1];
      cursor = {
        ticker: lastRow.ticker,
        time: lastRow.time instanceof Date ? lastRow.time.toISOString() : new Date(lastRow.time).toISOString(),
      };
    }

    return { seeded, replayed };
  }

  private async loadReconciliationRows(
    latestTargetTimes: LatestTargetRow[],
    cursor: ReconciliationCursor | null,
  ): Promise<ReconciliationSourceRow[]> {
    const values: unknown[] = [];
    const placeholders = latestTargetTimes.map((row, index) => {
      const offset = index * 2;
      values.push(row.ticker, row.latest_target_time instanceof Date ? row.latest_target_time.toISOString() : row.latest_target_time);
      return `($${offset + 1}, $${offset + 2}::timestamptz)`;
    });
    const cursorTickerIndex = values.length + 1;
    const cursorTimeIndex = values.length + 2;
    const limitIndex = values.length + 3;
    values.push(cursor?.ticker ?? "", cursor?.time ?? "1970-01-01T00:00:00.000Z", String(RECONCILIATION_PAGE_SIZE));

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
        AND (
          $${cursorTickerIndex} = ''
          OR (${SOURCE_TABLE}.ticker, ${SOURCE_TABLE}.time) > ($${cursorTickerIndex}, $${cursorTimeIndex}::timestamptz)
        )
      ORDER BY ${SOURCE_TABLE}.ticker ASC, ${SOURCE_TABLE}.time ASC
      LIMIT $${limitIndex}::int
    `;

    const result = await this.queryable.query<ReconciliationSourceRow>(query, values);
    return result.rows;
  }

  private async loadSourceRowsInRanges(ranges: SourceCatchupRange[]): Promise<StoredCandleRow[]> {
    if (ranges.length === 0) {
      return [];
    }

    const values: unknown[] = [];
    const placeholders = ranges.map((range, index) => {
      const offset = index * 3;
      values.push(range.ticker, range.start_exclusive_time, range.end_inclusive_time);
      return `($${offset + 1}, $${offset + 2}::timestamptz, $${offset + 3}::timestamptz)`;
    });

    const query = `
      WITH source_range(ticker, start_exclusive_time, end_inclusive_time) AS (
        VALUES ${placeholders.join(", ")}
      )
      SELECT
        ${SOURCE_COLUMNS_FROM_SOURCE_TABLE}
      FROM ${SOURCE_TABLE}
      JOIN source_range
        ON source_range.ticker = ${SOURCE_TABLE}.ticker
      WHERE time = date_trunc('minute', time)
        AND ${SOURCE_TABLE}.time > source_range.start_exclusive_time
        AND ${SOURCE_TABLE}.time <= source_range.end_inclusive_time
      ORDER BY ${SOURCE_TABLE}.ticker ASC, ${SOURCE_TABLE}.time ASC
    `;

    const result = await this.queryable.query<StoredCandleRow>(query, values);
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
