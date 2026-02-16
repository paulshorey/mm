# TradingView Node Service

Express service that owns the TradingView strength API previously hosted in `market-view-next`.

## Endpoints

- `POST /api/v1/tradingview`: accepts TradingView text payload and writes strength data.
- `GET /api/v1/tradingview`: reads `strength_v1` rows with optional query filters.
- `GET /health`: basic liveness check.

## Notes

- Keep route behavior compatible with prior Next.js API contract (`ok`, `status`, `rows`, `error`).
- Route handlers are split into `src/handlers/tradingview/` and mounted from `src/routes/tradingview.ts`.
- Strength parsing/read/write logic is centralized in `src/services/strength.ts`.
- Shared types and utilities are in `src/types/strength.ts` and `src/lib/*`.
- Invalid TradingView payloads and runtime handler failures should be logged via `sqlLogAdd` (`@lib/common/sql/log/add`) for observability.
- Import shared logging directly from `@lib/common/sql/log/add`; `@lib/common` is now ESM to support named exports in Node services.