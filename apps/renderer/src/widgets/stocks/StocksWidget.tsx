import { useState, useRef, type KeyboardEvent } from 'react';
import { TrendingUp, TrendingDown, Pencil, X, Plus } from 'lucide-react';
import { useStocks } from './useStocks';
import { useStocksStore } from '../../store/stocksStore';
import type { StockQuote } from '@dash/shared';

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
    <div className="bg-zinc-800/60 rounded-lg p-2.5 flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Icon size={12} className={`${color} shrink-0`} />
          <span className="font-mono font-bold text-white text-sm leading-none truncate">
            {q.ticker}
          </span>
        </div>
        <span className={`font-mono text-xs tabular-nums ${color} shrink-0`}>
          {positive ? '+' : ''}{fmt(q.changePercent)}%
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <span className="font-mono text-white text-base font-semibold tabular-nums leading-none">
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
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 w-72 max-h-[80%] flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Edit Watchlist</span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
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
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          <button
            onClick={submit}
            className="bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {watchlist.map((ticker) => (
            <div
              key={ticker}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-800 group"
            >
              <span className="font-mono text-white text-xs">{ticker}</span>
              <button
                onClick={() => removeTicker(ticker)}
                className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <p className="text-zinc-600 text-[10px]">
          Note: US equities only (Alpaca IEX feed). Futures/crypto tickers not supported.
        </p>
      </div>
    </div>
  );
}

export function StocksWidget() {
  const { data, isLoading, isError } = useStocks();
  const [editing, setEditing] = useState(false);
  const anyOpen = data?.equities.some((q) => q.marketOpen) ?? false;

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {editing && <WatchlistModal onClose={() => setEditing(false)} />}

      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 shrink-0">
        <span className="text-[10px] text-zinc-500 flex items-center gap-1.5">
          {anyOpen ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Market Open
            </>
          ) : (
            <span className="text-zinc-600">Market Closed · close prices</span>
          )}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors p-0.5"
          title="Edit watchlist"
        >
          <Pencil size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
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
