import { subscribeSymbols, onQuote, onTrade } from './alpacaWs';
import type { StockQuote, StocksData } from '@dash/shared';

export const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'SPY', 'QQQ'];

const BASE_URL = process.env['ALPACA_BASE_URL'] ?? 'https://data.alpaca.markets/v2';

interface AlpacaSnapshotBar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface AlpacaSnapshotQuote {
  bp: number;
  ap: number;
  bs: number;
  as: number;
}

interface AlpacaSnapshotTrade {
  p: number;
  s: number;
}

interface AlpacaSnapshot {
  symbol: string;
  dailyBar?: AlpacaSnapshotBar;
  latestQuote?: AlpacaSnapshotQuote;
  latestTrade?: AlpacaSnapshotTrade;
  prevDailyBar?: AlpacaSnapshotBar;
}

function authHeaders(): Record<string, string> {
  return {
    'APCA-API-KEY-ID': process.env['ALPACA_API_KEY'] ?? '',
    'APCA-API-SECRET-KEY': process.env['ALPACA_API_SECRET'] ?? '',
  };
}

function isMarketOpen(): boolean {
  const now = new Date();
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(now);
  if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') return false;

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(timeParts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(timeParts.find((p) => p.type === 'minute')?.value ?? 0);
  const totalMinutes = hour * 60 + minute;

  return totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60;
}

const quotes: Map<string, { bid: number; ask: number }> = new Map();
const trades: Map<string, { price: number; size: number }> = new Map();
let snapshotCache: Map<string, AlpacaSnapshot> = new Map();
let snapshotFetchedAt = 0;
const SNAPSHOT_TTL_MS = 5000;

export async function fetchSnapshot(): Promise<void> {
  const url = `${BASE_URL}/stocks/snapshots?symbols=${TICKERS.join(',')}&feed=iex`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Alpaca snapshot error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as Record<string, AlpacaSnapshot>;
  snapshotCache = new Map(Object.entries(data));
  snapshotFetchedAt = Date.now();
}

export function getStocksData(): StocksData {
  const open = isMarketOpen();

  const equities: StockQuote[] = TICKERS.map((ticker) => {
    const snap = snapshotCache.get(ticker);
    const wsQuote = quotes.get(ticker);
    const wsTrade = trades.get(ticker);

    const lastPrice = wsTrade?.price ?? snap?.latestTrade?.p ?? snap?.dailyBar?.c ?? 0;
    const prevClose = snap?.prevDailyBar?.c ?? lastPrice;
    const change = prevClose > 0 ? lastPrice - prevClose : 0;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      lastPrice,
      change,
      changePercent,
      bid: wsQuote?.bid ?? snap?.latestQuote?.bp ?? 0,
      ask: wsQuote?.ask ?? snap?.latestQuote?.ap ?? 0,
      volume: snap?.dailyBar?.v ?? 0,
      dayHigh: snap?.dailyBar?.h ?? 0,
      dayLow: snap?.dailyBar?.l ?? 0,
      marketOpen: open,
    };
  });

  return { equities, updatedAt: new Date().toISOString() };
}

export async function getStocksDataFresh(): Promise<StocksData> {
  if (Date.now() - snapshotFetchedAt > SNAPSHOT_TTL_MS) {
    await fetchSnapshot();
  }
  return getStocksData();
}

export function startWs(): void {
  subscribeSymbols(TICKERS);

  onQuote((symbol, bid, ask) => {
    quotes.set(symbol, { bid, ask });
  });

  onTrade((symbol, price, size) => {
    trades.set(symbol, { price, size });
  });
}
