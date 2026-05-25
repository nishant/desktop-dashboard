export interface StockQuote {
  ticker: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  marketOpen: boolean;
  sparkline: number[];
}

export interface StocksData {
  equities: StockQuote[];
  updatedAt: string;
}
