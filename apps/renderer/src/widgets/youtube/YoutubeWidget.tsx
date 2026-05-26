import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useYoutubeSearch } from './useYoutube';
import type { YoutubeVideo } from '@dash/shared';

// ── Video player ──────────────────────────────────────────────────────────────

function Player({ video, onClose }: { video: YoutubeVideo; onClose: () => void }) {
  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* 16:9 iframe */}
      <div className="w-full shrink-0" style={{ aspectRatio: '16/9' }}>
        <iframe
          key={video.videoId}
          src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Title + close */}
      <div className="flex items-start gap-2 px-3 pt-2 pb-1 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-zinc-200 text-xs font-medium leading-snug line-clamp-2">{video.title}</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">{video.channelTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
          title="Back to search"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({
  value, onChange, onSubmit, loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800 shrink-0">
      <Search size={12} className="text-zinc-600 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
        placeholder="Search YouTube…"
        className="flex-1 bg-transparent text-zinc-300 text-xs placeholder-zinc-600 outline-none"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <X size={11} />
        </button>
      )}
      <button
        onClick={onSubmit}
        disabled={!value.trim() || loading}
        className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({ video, onPlay }: { video: YoutubeVideo; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-zinc-800/60 transition-colors text-left"
    >
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-16 h-9 object-cover rounded shrink-0 bg-zinc-800"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="text-zinc-200 text-[11px] leading-snug line-clamp-2 font-medium">{video.title}</p>
        <p className="text-zinc-500 text-[10px] mt-0.5 truncate">{video.channelTitle}</p>
      </div>
    </button>
  );
}

// ── Widget root ───────────────────────────────────────────────────────────────

export function YoutubeWidget() {
  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Measure container height to decide layout
  useEffect(() => {
    if (!containerEl) return;
    let rafId: number;
    const tryMeasure = () => {
      const h = containerEl.getBoundingClientRect().height;
      if (h > 0) setHeight(h);
      else rafId = requestAnimationFrame(tryMeasure);
    };
    rafId = requestAnimationFrame(tryMeasure);
    const ro = new ResizeObserver(([e]) => setHeight(e.contentRect.height));
    ro.observe(containerEl);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [containerEl]);

  const { data, isFetching, isError } = useYoutubeSearch(submittedQuery);

  const handleSubmit = () => {
    const q = inputValue.trim();
    if (!q) return;
    setSelectedVideo(null);
    setSubmittedQuery(q);
    // scroll results back to top
    if (resultsRef.current) resultsRef.current.scrollTop = 0;
  };

  // If a video is selected AND there's enough height to show player + search,
  // show both. Below ~300px show player-only (fills tile); above that show split.
  const showPlayer = selectedVideo !== null;
  const showSearchBelowPlayer = showPlayer && height > 280;
  const playerOnly = showPlayer && height <= 280;

  if (playerOnly && selectedVideo) {
    return (
      <div ref={setContainerEl} className="h-full flex flex-col overflow-hidden">
        <Player video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      </div>
    );
  }

  return (
    <div ref={setContainerEl} className="h-full flex flex-col overflow-hidden">
      {/* Player (when video selected and tall enough) */}
      {showPlayer && selectedVideo && (
        <Player video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}

      {/* Search bar — always visible (unless player-only handled above) */}
      {(!showPlayer || showSearchBelowPlayer) && (
        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          loading={isFetching}
        />
      )}

      {/* Results */}
      {(!showPlayer || showSearchBelowPlayer) && (
        <div ref={resultsRef} className="flex-1 overflow-y-auto min-h-0">
          {!submittedQuery && (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
              <Search size={20} className="text-zinc-700" />
              <p className="text-zinc-600 text-xs text-center">Search for videos above</p>
            </div>
          )}

          {submittedQuery && isFetching && !data && (
            <p className="text-zinc-600 text-xs text-center py-6">Searching…</p>
          )}

          {isError && (
            <p className="text-red-400/70 text-xs text-center py-6">
              Search failed — check YOUTUBE_API_KEY in .env
            </p>
          )}

          {data?.items.map((video) => (
            <ResultRow
              key={video.videoId}
              video={video}
              onPlay={() => setSelectedVideo(video)}
            />
          ))}

          {data?.items.length === 0 && (
            <p className="text-zinc-600 text-xs text-center py-6">No results</p>
          )}
        </div>
      )}
    </div>
  );
}
