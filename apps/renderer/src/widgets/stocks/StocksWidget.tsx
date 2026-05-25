import { useStocks } from './useStocks';
import type { StockQuote } from '@dash/shared';

function formatPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(n: number, pct: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatPrice(n)} (${sign}${pct.toFixed(2)}%)`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function QuoteRow({ q }: { q: StockQuote }) {
  const positive = q.change >= 0;
  const changeColor = positive ? 'text-emerald-400' : 'text-red-400';

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
      <td className="py-1.5 pl-3 pr-2 font-mono font-semibold text-white text-xs w-16">
        {q.ticker}
        {!q.marketOpen && (
          <span className="ml-1 text-[9px] text-zinc-500 font-normal">CLO</span>
        )}
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-white text-xs tabular-nums">
        ${formatPrice(q.lastPrice)}
      </td>
      <td className={`py-1.5 px-2 text-right font-mono text-xs tabular-nums ${changeColor}`}>
        {formatChange(q.change, q.changePercent)}
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-zinc-400 text-xs tabular-nums hidden lg:table-cell">
        {formatPrice(q.bid)}
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-zinc-400 text-xs tabular-nums hidden lg:table-cell">
        {formatPrice(q.ask)}
      </td>
      <td className="py-1.5 px-2 text-right font-mono text-zinc-500 text-xs tabular-nums hidden xl:table-cell">
        {formatPrice(q.dayLow)} – {formatPrice(q.dayHigh)}
      </td>
      <td className="py-1.5 pl-2 pr-3 text-right font-mono text-zinc-500 text-xs tabular-nums hidden xl:table-cell">
        {formatVolume(q.volume)}
      </td>
    </tr>
  );
}

export function StocksWidget() {
  const { data, isLoading, isError } = useStocks();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        Loading market data…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm">
        Failed to load market data
      </div>
    );
  }

  const anyOpen = data.equities.some((q) => q.marketOpen);
  const updatedAt = new Date(data.updatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-800 shrink-0">
        <span className="text-[10px] text-zinc-500">
          {anyOpen ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Market Open
            </span>
          ) : (
            <span className="text-zinc-600">Market Closed</span>
          )}
        </span>
        <span className="text-[10px] text-zinc-600 tabular-nums">{updatedAt}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] text-zinc-600 uppercase tracking-wider">
              <th className="py-1 pl-3 pr-2 text-left font-normal">Ticker</th>
              <th className="py-1 px-2 text-right font-normal">Last</th>
              <th className="py-1 px-2 text-right font-normal">Change</th>
              <th className="py-1 px-2 text-right font-normal hidden lg:table-cell">Bid</th>
              <th className="py-1 px-2 text-right font-normal hidden lg:table-cell">Ask</th>
              <th className="py-1 px-2 text-right font-normal hidden xl:table-cell">Range</th>
              <th className="py-1 pl-2 pr-3 text-right font-normal hidden xl:table-cell">Vol</th>
            </tr>
          </thead>
          <tbody>
            {data.equities.map((q) => (
              <QuoteRow key={q.ticker} q={q} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
