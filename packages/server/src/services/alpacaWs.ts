import WebSocket from 'ws';

export type QuoteHandler = (symbol: string, bid: number, ask: number, bidSize: number, askSize: number) => void;
export type TradeHandler = (symbol: string, price: number, size: number) => void;

const WS_URL = 'wss://stream.data.alpaca.markets/v2/iex';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let subscribedSymbols: string[] = [];

const quoteHandlers = new Set<QuoteHandler>();
const tradeHandlers = new Set<TradeHandler>();

function connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(WS_URL, {
    headers: {
      'APCA-API-KEY-ID': process.env['ALPACA_API_KEY'] ?? '',
      'APCA-API-SECRET-KEY': process.env['ALPACA_API_SECRET'] ?? '',
    },
  });

  ws.on('open', () => {
    console.log('[alpacaWs] connected');
    resubscribe();
  });

  ws.on('message', (raw) => {
    let messages: unknown;
    try {
      messages = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!Array.isArray(messages)) return;

    for (const msg of messages) {
      if (typeof msg !== 'object' || msg === null) continue;
      const m = msg as Record<string, unknown>;

      if (m['T'] === 'q') {
        // quote
        const symbol = String(m['S'] ?? '');
        const bp = Number(m['bp'] ?? 0);
        const ap = Number(m['ap'] ?? 0);
        const bs = Number(m['bs'] ?? 0);
        const as_ = Number(m['as'] ?? 0);
        quoteHandlers.forEach((h) => h(symbol, bp, ap, bs, as_));
      } else if (m['T'] === 't') {
        // trade
        const symbol = String(m['S'] ?? '');
        const price = Number(m['p'] ?? 0);
        const size = Number(m['s'] ?? 0);
        tradeHandlers.forEach((h) => h(symbol, price, size));
      } else if (m['T'] === 'error') {
        console.error('[alpacaWs] error message:', m['msg']);
      }
    }
  });

  ws.on('close', () => {
    console.log('[alpacaWs] disconnected — reconnecting in 5s');
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    console.error('[alpacaWs] error:', err.message);
    ws?.terminate();
  });
}

function resubscribe(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || subscribedSymbols.length === 0) return;
  ws.send(JSON.stringify({ action: 'subscribe', trades: subscribedSymbols, quotes: subscribedSymbols }));
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 5000);
}

export function subscribeSymbols(symbols: string[]): void {
  subscribedSymbols = symbols;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connect();
    return;
  }
  ws.send(JSON.stringify({ action: 'subscribe', trades: symbols, quotes: symbols }));
}

export function onQuote(handler: QuoteHandler): () => void {
  quoteHandlers.add(handler);
  return () => quoteHandlers.delete(handler);
}

export function onTrade(handler: TradeHandler): () => void {
  tradeHandlers.add(handler);
  return () => tradeHandlers.delete(handler);
}

export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}
