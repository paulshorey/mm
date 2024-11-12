export const defaults = {
  default: {
    LONG: 1.5,
    SHORT: 1.5,
    precision: 1,
  },
  'SOL-USD': {
    precision: 0.1,
  },
  'SUI-USD': {
    LONG: 2,
    SHORT: 2,
    precision: 10,
  },
  'ETH-USD': {
    precision: 0.001,
  },
  'BCH-USD': {
    precision: 0.01,
  },
  'BTC-USD': {
    LONG: 1,
    SHORT: 1,
    precision: 0.0001,
  },
  'SUNDOG-USD': {
    precision: 20,
  },
} as {
  [key: string]: {
    LONG?: number
    SHORT?: number
    precision?: number
  }
}
