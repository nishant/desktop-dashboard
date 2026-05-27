import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { TrendingUp, TrendingDown, Pencil, X, Plus } from 'lucide-react';
import { useStocks } from './useStocks';
import { useStocksStore } from '../../store/stocksStore';
import type { StockQuote } from '@dash/shared';

// ── Market session ────────────────────────────────────────────────────────────

type MarketSession = 'open' | 'after-hours' | 'pre-market' | 'closed';

function getMarketSession(): MarketSession {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const min = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const total = hour * 60 + min;
  if (day === 'Sat' || day === 'Sun') return 'closed';
  if (total >= 9 * 60 + 30 && total < 16 * 60) return 'open';
  if (total >= 16 * 60 && total < 20 * 60) return 'after-hours';
  if (total >= 4 * 60 && total < 9 * 60 + 30) return 'pre-market';
  return 'closed';
}

function useMarketSession(): MarketSession {
  const [session, setSession] = useState<MarketSession>(getMarketSession);
  useEffect(() => {
    const id = setInterval(() => setSession(getMarketSession()), 60_000);
    return () => clearInterval(id);
  }, []);
  return session;
}

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1000) return fmt(n, 2);
  return fmt(n, 2);
}


function QuoteCard({ q }: { q: StockQuote }) {
  const positive = q.change >= 0;
  const color = positive ? 'text-emerald-400' : 'text-red-400';
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-th-elevated/60 rounded-lg p-2.5 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Icon size={12} className={`${color} shrink-0`} />
          <span className="font-mono font-bold text-th-hi text-sm leading-none truncate">
            {q.ticker}
          </span>
        </div>
        <span className={`font-mono text-xs tabular-nums ${color} shrink-0`}>
          {positive ? '+' : ''}{fmt(q.changePercent)}%
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <span className="font-mono text-th-hi text-base font-semibold tabular-nums leading-none">
          {fmtPrice(q.lastPrice)}
        </span>
        <span className={`font-mono text-xs tabular-nums ${color} shrink-0`}>
          {positive ? '+' : ''}{fmt(q.change)}
        </span>
      </div>
    </div>
  );
}

function WatchlistModal({ onClose }: { onClose: () => void }) {
  const { watchlist, addTicker, removeTicker } = useStocksStore();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const ticker = input.trim().toUpperCase();
    if (ticker) {
      addTicker(ticker);
      setInput('');
      inputRef.current?.focus();
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-lg">
      <div className="bg-th-surface border border-th-line rounded-xl p-4 w-72 max-h-[80%] flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-th-hi font-semibold text-sm">Edit Watchlist</span>
          <button
            onClick={onClose}
            className="text-th-3 hover:text-th-hi transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Add ticker…"
            className="flex-1 bg-th-elevated border border-th-line rounded-lg px-3 py-1.5 text-th-hi text-xs font-mono placeholder:text-th-ghost focus:outline-none focus:border-th-3"
            autoFocus
          />
          <button
            onClick={submit}
            className="bg-th-overlay hover:bg-th-overlay/70 text-th-hi rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {watchlist.map((ticker) => (
            <div
              key={ticker}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-th-elevated group"
            >
              <span className="font-mono text-th-hi text-xs">{ticker}</span>
              <button
                onClick={() => removeTicker(ticker)}
                className="text-th-ghost hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <p className="text-th-ghost text-[10px]">
          Note: US equities only (Alpaca IEX feed). Futures/crypto tickers not supported.
        </p>
      </div>
    </div>
  );
}

export function StocksWidget() {
  const { data, isLoading, isError } = useStocks();
  const [editing, setEditing] = useState(false);
  const session = useMarketSession();

  const sessionDot: Record<MarketSession, string> = {
    open:         'bg-emerald-400 animate-pulse',
    'after-hours': 'bg-amber-400 animate-pulse',
    'pre-market':  'bg-amber-400 animate-pulse',
    closed:       'bg-red-500',
  };
  const sessionLabel: Record<MarketSession, string> = {
    open:         'Market Open',
    'after-hours': 'After Hours',
    'pre-market':  'Pre-Market',
    closed:       'Market Closed · Last close',
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {editing && <WatchlistModal onClose={() => setEditing(false)} />}

      <div className="flex items-center justify-between px-3 py-1.5 border-b border-th-line shrink-0">
        <span className={`text-[10px] flex items-center gap-1.5 ${session === 'closed' ? 'text-th-ghost' : 'text-th-3'}`}>
          <span className={`h-1.5 w-1.5 rounded-full inline-block shrink-0 ${sessionDot[session]}`} />
          {sessionLabel[session]}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-th-ghost hover:text-th-hi transition-colors p-0.5"
          title="Edit watchlist"
        >
          <Pencil size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-th-3 text-sm">
            Loading…
          </div>
        )}
        {isError && (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">
            Failed to load market data
          </div>
        )}
        {data && (
          <div className="grid grid-cols-2 gap-2">
            {data.equities.map((q) => (
              <QuoteCard key={q.ticker} q={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
