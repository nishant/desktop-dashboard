# Changelog

All changes organized by pull request, newest first.

---

## [PR #17] feat: titlebar with window drag + expanded layout presets
**Branch:** `feat/titlebar-and-layouts` → `master`
**Date:** 2026-05-25

### Added
- **`Titlebar.tsx`** — 32px bar pinned above the grid. Left side shows "nishboard" label. Entire bar carries `-webkit-app-region: drag` (Electron frameless window drag). Right side hosts the layout preset buttons with `-webkit-app-region: no-drag` so clicks register. Replaces the old floating `LayoutToolbar`.
- **Layout presets** — 3 new presets added to `layouts.ts`:
  - **Focus** — Spotify takes up a tall left column (18 rows), Stocks fills top-right (14 rows), Weather + Sound split the bottom-right, Hardware is a thin strip below Spotify.
  - **Chill** — Weather, Hardware, Sound stacked in a narrow left column; Stocks and Spotify each take a full-height column (all 22 rows) to the right.
  - **Wide** — Two big horizontal rows: Stocks + Spotify split the top 12 rows; Hardware + Weather + Sound split the bottom 10 rows.

### Changed
- **`App.tsx`** — switched to `flex-col` layout; Titlebar sits above a `flex-1` grid container.
- **`DashboardGrid.tsx`** — `useRowHeight` now subtracts `TITLEBAR_H` (32px) from `window.innerHeight` so the grid fills the space below the titlebar exactly.
- **`LayoutToolbar.tsx`** — deleted (replaced by Titlebar).

---

## [PR #16] fix: Spotify widget resize broken on macOS fresh start
**Branch:** `fix/spotify-resize-mac` → `master`
**Date:** 2026-05-25

### Fixed
- **Root cause identified**: `SpotifyWidget` has conditional early returns for loading and auth states. Those views don't render the `ref={containerRef}` div, so `containerRef.current` is `null` when `useLayoutEffect([], [])` fires on first mount. With an empty dep array, the effect never re-runs once the real element appears — the ResizeObserver is never set up and the widget stays at the initial `'sm'` size forever.
- **Fix**: Replaced `useRef` + `useLayoutEffect([])` with a `useState` callback ref (`setContainerEl`) + `useEffect([containerEl])`. React calls the callback ref when the element actually mounts (after loading/auth resolves), which updates the state and re-triggers the effect with the real element.
- **Retained retry RAF loop**: Single RAF wasn't enough on macOS — Chromium can return `0` from `getBoundingClientRect` for multiple frames while the flex grid row is compositing. The retry loop keeps requesting frames until it gets a non-zero height, then hands off to the ResizeObserver for all subsequent updates.

---

## [PR #15] fix: weather hourly strip — hide scrollbar, add wheel + drag-to-scroll
**Branch:** `fix/weather-scrollbar-windows` → `master`
**Date:** 2026-05-25

### Fixed
- **Scrollbar hidden cross-platform** (`index.css`) — added explicit `.scrollbar-none` CSS rules (`::-webkit-scrollbar { display: none }`, `scrollbar-width: none`, `-ms-overflow-style: none`). Previously only the Tailwind class name existed with no backing CSS rule, so macOS overlay scrollbars hid themselves naturally but Windows always showed the native bar.
- **Wheel-to-horizontal-scroll** (`WeatherWidget.tsx`) — `wheel` events on the hourly strip now map vertical delta to `scrollLeft`. Native horizontal scroll (trackpad two-finger swipe) still passes through unchanged.
- **Click-and-drag to pan** (`WeatherWidget.tsx`) — `mousedown`/`mousemove`/`mouseup` handlers on the hourly strip enable click-and-drag scrolling. Cursor changes to `grabbing` while dragging. Listeners on `window` so drag works even if the mouse leaves the strip.

### Changed
- **`CLAUDE.md`** — updated Git Workflow rule 3 to explicitly say "Do NOT auto-merge — wait for Nish to explicitly say 'merge'".

---

## [PR #14] chore: document git workflow + memory protocol in CLAUDE.md
**Branch:** `chore/claude-md-workflow-rules` → `master`
**Date:** 2026-05-25

### Changed
- **`CLAUDE.md`** — added two new sections:
  - **Git Workflow**: branch-first rule, CHANGELOG-before-PR rule, branch naming convention (`feat/` / `fix/`)
  - **Memory Protocol**: new preferences go into both `CLAUDE.md` (committed, travels with repo) and `~/.claude/projects/…/memory/` (local machine memory)

---

## [PR #13] fix: Spotify — conditional text scroll + macOS sizing init
**Branch:** `fix/spotify-scroll-overflow` → `master`
**Date:** 2026-05-25

### Fixed
- **Conditional scroll** (`ScrollingText`) — text now only animates when it actually overflows its container. Added a `ResizeObserver` inside `ScrollingText` so it re-measures on every container width change (catches `SizeVariant` transitions in both directions). 1px sub-pixel rounding tolerance added to prevent spurious animation on near-exact fits.
- **macOS `SizeVariant` init** — `getBoundingClientRect().height` can return `0` inside `useLayoutEffect` on macOS/Chromium before the flex grid row height has been composited. Added a `requestAnimationFrame` re-seed so the correct height is read after the browser's first paint, preventing the widget from staying stuck at `xs`.

---

## [PR #12] feat: Spotify scrolling text marquee + ResizeObserver timing fix
**Branch:** `fix/spotify-bugfixes` → `master`
**Date:** 2026-05-25

### Added
- **Scrolling text** (`SpotifyWidget.tsx`) — track name, artist, and album name now scroll horizontally instead of truncating with `…`. Pattern: 2s pause → smooth scroll at 40px/s → 2s pause → instant reset → repeat. Uses the Web Animations API (`element.animate()`). Short text that fits the container is left static (no animation started).

### Fixed
- **ResizeObserver timing** — replaced `useEffect` with `useLayoutEffect` for the `ResizeObserver` that drives size variants. Also seeds the initial `SizeVariant` immediately from `getBoundingClientRect()` before the first observer callback, preventing a stuck `sm` layout on fresh page load.
- **`xs` empty-space gap** — `justify-between` on the compact layout was leaving a large dead zone when the tile is very short. `xs` now uses `justify-center gap-3` to pack content together; `sm` keeps `justify-between`.

---

## [PR #11] feat: Spotify widget — 5-tier responsive layout
**Branch:** `fix/spotify-bugfixes` → `master`
**Date:** 2026-05-25

### Changed
- **5-tier `SizeVariant`** (`SpotifyWidget.tsx`) — replaced binary `compact / expanded` with `xs | sm | md | lg | xl` driven by a `ResizeObserver` on the widget root:
  - `xs` < 200px — compact horizontal, 40px art
  - `sm` 200–299px — compact horizontal, 56px art, `justify-between` fills height
  - `md` 300–399px — expanded vertical, album art capped at 110px
  - `lg` 400–479px — expanded vertical, album art capped at 165px
  - `xl` ≥ 480px — expanded vertical, album art capped at 220px
- **Per-tier icon scaling** — play button, skip, seek, and shuffle/repeat icons all scale with the tile height so controls feel proportional rather than tiny on large tiles.
- **`VolumeSlider` updated** — `iconSize` and slider width scale with `lg`/`xl` tiers (was still comparing against old `'expanded'` string).

---

## [PR #10] fix: Spotify expanded layout flex pass-through
**Branch:** `fix/spotify-layout-flex` → `master`
**Date:** 2026-05-25

### Fixed
- **Expanded layout not filling height** (`SpotifyWidget.tsx`) — `h-full` on the `NowPlayingView` expanded root could resolve to 0 in Chromium when the parent is a `flex-1 min-h-0` item without an explicit `height` declaration. Fixed by:
  1. Making the intermediate wrapper `flex-1 min-h-0 flex flex-col` (flex pass-through)
  2. Changing the expanded layout root from `h-full flex flex-col` → `flex-1 flex flex-col` so it inherits flex sizing instead of relying on percentage-height resolution

---

## [PR #9] fix: Spotify widget bugfixes — liked songs, volume slider, responsive layout, icon polish
**Branch:** `fix/spotify-bugfixes` → `master`
**Date:** 2026-05-25

### Fixed
- **Liked Songs 400 error** (`packages/server/src/routes/spotify.ts`) — Spotify's `/v1/me/tracks` endpoint caps at 50; server was sending 100. Now clamps liked-songs branch to `Math.min(50, ...)` while regular playlists keep 100.
- **Volume slider jumping back** (`apps/renderer/src/widgets/spotify/useSpotify.ts`) — `useSpotifyVolume.onSettled` was immediately invalidating `['spotify-now-playing']`, triggering a refetch that returned Spotify's stale volume and overwrote the optimistic update. Removed `onSettled`; 3s polling handles eventual sync.
- **Playlist icon color** (`SpotifyWidget.tsx`) — `ListMusic` button was `text-zinc-600` (darker than peers); corrected to `text-zinc-500`.
- **Responsive layout not filling space** (`SpotifyWidget.tsx`) — Expanded mode (≥ 280px height, detected via `ResizeObserver`) now uses a true `h-full flex flex-col` layout: track title + artist pinned top, album art in a `flex-1` grow zone (`max-h-[240px]`, `aspect-square`), progress + controls + volume pinned bottom. Previously only bumped fixed pixel sizes with no vertical fill.

### Changed
- **Header removed** — Green dot and "SPOTIFY" label stripped; reclaims ~32px. Search (🔍) and playlist (🎵) icons moved inline next to track info. Both buttons also present in the "nothing playing" view.

### Notes
- Bug #4 (search 404): no code change — route exists, just requires `pnpm dev` restart to pick up after the PR #8 merge.

---

## [PR #8] feat: Spotify search dialog with play / add-to-queue
**Branch:** `feat/spotify-search` → `master`
**Date:** 2026-05-25

### Added
- **Search dialog** (`apps/renderer/src/widgets/spotify/SpotifySearchDialog.tsx`) — portal'd overlay, opens via 🔍 in widget header. 250ms debounced input, Esc/backdrop closes.
- **Result rows** — thumbnail, track name, artist, duration; **▶ Play** and **+ Queue** action buttons per row with inline ✓/✗ feedback.
- `GET /api/spotify/search?q&limit` (`packages/server/src/routes/spotify.ts`) — proxies Spotify search API (`type=track,episode`); 30s server-side cache keyed by lowercased query, LRU-evicts at 100 entries.
- `POST /api/spotify/queue { uri, deviceId? }` — proxies `POST /v1/me/player/queue`.
- `SpotifySearchResults` type (`packages/shared/src/types/spotify.ts`).
- `useDebouncedValue<T>`, `useSpotifySearch`, `useQueueTrack` hooks (`useSpotify.ts`).
- **Fixed** `.env.example` redirect URI: `http://127.0.0.1:7432/spotify/callback` → `/api/spotify/callback`.

### Notes
- `market=from_token` omitted — requires `user-read-private` scope not present in token. Spotify returns global results without it.
- Queue requires an active playback context; 404 from Spotify if nothing is playing on a device.

---

## [PR #7] feat: Spotify widget — now playing, playlists, track list, podcasts, OAuth
**Branch:** `feature/spotify-widget` → `master`  
**Date:** 2026-05-25

### Added
- `packages/server/src/routes/spotify.ts` — full implementation:
  - **PKCE OAuth:** `GET /api/spotify/auth-url` generates PKCE params, returns auth URL; `GET /api/spotify/callback` exchanges code for tokens
  - Tokens persisted to `~/.dash/spotify_tokens.json`; auto-refresh when < 60s from expiry
  - `GET /api/spotify/auth-status`, `GET /api/spotify/now-playing` (2.5s TTL cache)
  - **Podcast support:** `additional_types=track,episode`; episode maps show name → artist field, show artwork
  - `POST /api/spotify/play`, `/pause`, `/next`, `/previous`, `/seek`, `/volume`, `/shuffle`, `/repeat`
  - `GET /api/spotify/playlists?offset&limit` — paginated (20/page); Liked Songs synthetic item prepended at offset=0 (parallel fetch for badge count); 30s page cache
  - `GET /api/spotify/playlist-tracks?playlistId&offset&limit` — 100/page; handles both regular playlists and `liked-songs` (maps to `GET /me/tracks`); per-page 60s cache; filters local tracks
  - `GET /api/spotify/devices` — 5s cache
  - `POST /api/spotify/play-context { contextUri, deviceId?, shuffle? }` — sets shuffle state before starting if requested
  - `POST /api/spotify/play-track { trackUri, contextUri?, deviceId? }` — plays specific track within context
  - Scopes: `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `playlist-read-private`, `playlist-read-collaborative`, `user-library-read`
- `packages/shared/src/types/spotify.ts` — `TrackData` (+ `type: 'track' | 'episode'`), `SpotifyPlaylist`, `SpotifyDevice`, `SpotifyTrackItem`, `SpotifyPlaylistsPage`, `SpotifyTracksPage`
- `apps/renderer/src/widgets/spotify/useSpotify.ts`:
  - `usePlaylistsInfinite()` — `useInfiniteQuery`, 20/page
  - `usePlaylistTracksInfinite(playlistId)` — `useInfiniteQuery`, 100/page
  - `useDevices()`, `usePlayContext()`, `usePlayTrack()`
  - Optimistic updates on all playback mutations
- `apps/renderer/src/widgets/spotify/SpotifyWidget.tsx`:
  - **Auth:** Connect Spotify → PKCE flow via `shell.openExternal`
  - **Now playing:** album art, track/artist/album, smooth progress bar (1s local ticker between 3s polls), prev / ←15s / play-pause / 15s→ / next controls, shuffle + repeat toggles, volume slider
  - **Volume icon click** → mute toggle; restores pre-mute level on second click
  - **±15s buttons** (`RotateCcw`/`RotateCw`) use ref-tracked local progress for accuracy
  - **Playlist panel** (toggle via `ListMusic` icon or "Browse playlists" button):
    - Infinite scroll playlist list — play button + shuffle button always visible; click row body → track list
    - Infinite scroll track list — click track → starts playback; local files greyed/disabled
    - Device chips at top — click to target playback device; active device auto-selected
    - Liked Songs first with heart icon + indigo→purple gradient
  - **Podcast now-playing:** `Mic2` icon fallback, "Podcast" label, no album line
- `apps/main/src/ipc/index.ts` — `spotify:open-auth` via `shell.openExternal(url)`
- `apps/main/src/preload.ts` — `openSpotifyAuth(url: string)` via contextBridge
- `apps/renderer/src/lib/apiClient.ts` — **fix:** omit `Content-Type` header when body is absent; skip `res.json()` on 204 responses (was causing `FST_ERR_CTP_EMPTY_JSON_BODY` on all no-body POSTs)

### Notes
- **Re-auth required** for new scopes (`playlist-read-private`, `playlist-read-collaborative`, `user-library-read`) — click Connect Spotify; `show_dialog=false` makes it instant
- **Redirect URI:** `SPOTIFY_REDIRECT_URI=http://127.0.0.1:7432/api/spotify/callback` — must also be registered in Spotify Developer Dashboard
- **Token file:** `~/.dash/spotify_tokens.json` — delete to force re-auth
- **`apiClient` fix** also repairs the sound widget's mute/device mutations which had the same silent failure

---

## [PR #6] feat: hardware widget — CPU, GPU, RAM, disk, network with bars/sparklines toggle
**Branch:** `feature/hardware-widget` → `master`  
**Date:** 2026-05-24

### Added
- `packages/server/src/routes/hardware.ts` — full `systeminformation` implementation:
  - All subsystems fetched in parallel via `Promise.all`
  - CPU: brand/cores/physicalCores cached statically (fetched once); live usage + per-core load + temp
  - GPU: picks highest-VRAM controller (dGPU > iGPU on multi-GPU Windows machines); VRAM used/total, utilization %, temp, clock speed — all from nvidia-smi on Windows NVIDIA
  - RAM: uses `mem.active` (actual in-use pages) rather than `mem.used` for accurate macOS figure; swap included
  - Disk I/O: aggregate read/write MB/s via `si.fsStats()` (`rx_sec`/`wx_sec`); per-mount usage from `si.fsSize()` with virtual/snap filesystem filtering
  - Network: bytes→Mbps, loopback excluded, sorted by activity (not filtered) — always shows top 3 real interfaces
  - Battery: shown only when `hasBattery === true` (macOS laptops)
  - Uptime via `os.uptime()`
  - 900ms TTL cache (prevents duplicate systeminformation calls from 1s poll)
- `packages/shared/src/types/hardware.ts` — extended types:
  - `CpuData`: added `brand`, `cores`, `physicalCores`
  - `GpuData`: added `name`, `clockMhz`
  - `HardwareData.ram`: added `swapUsedMb`, `swapTotalMb`
  - New `DiskUsage` interface: `mount`, `usedGb`, `totalGb`, `usePercent`
  - `HardwareData`: added `diskUsage`, `uptime`, `battery`
- `apps/renderer/src/widgets/hardware/useHardware.ts` — 1s refetch hook with 60-entry rolling history buffers (cpuUsage, gpuUsage, ramUsage, netUp, netDown, diskRead, diskWrite)
- `apps/renderer/src/widgets/hardware/HardwareWidget.tsx`:
  - **Bars mode:** animated usage bars for CPU/GPU/RAM; VRAM secondary bar; per-mount disk usage bars
  - **Sparks mode:** Recharts AreaChart sparklines for each metric (60-second history)
  - Toggle button (Bars / Sparks) in widget header
  - Per-core mini bars (color-coded: blue→amber→red by load)
  - Temperature color-coding: green <70°C, amber 70–84°C, red ≥85°C
  - **Configure panel:** gear button in header opens a 2-col checkbox grid; toggles which sections (CPU/GPU/RAM/Disk/Network/Battery) are rendered; all sections on by default
  - GPU always renders (shows "No GPU detected" placeholder if `gpu` is null) — no unmounting on null
  - Battery always renders when section is visible (shows "No battery" placeholder on desktop) — no unmounting
  - Network always renders top-N interfaces regardless of idle traffic — no unmounting on idle
  - Uptime in footer
- `apps/renderer/src/store/hardwareStore.ts` — Zustand `persist` store; section visibility saved to `localStorage` under key `hardware-config`

### Notes
- **Windows gaming:** GPU usage/VRAM/temp/clock require NVIDIA drivers (nvidia-smi); systeminformation calls it automatically
- **macOS:** GPU utilization is not available (Apple Silicon has no systeminformation support for GPU usage); VRAM shows 0/dynamic; battery card appears on MacBook
- **First poll:** `fsStats` disk I/O returns 0 on the very first call (needs baseline); accurate from second poll onward

---

## [PR #5] feat: sound widget — volume, mute, device switching, Windows app mixer
**Branch:** `feature/sound-widget` → `master`  
**Date:** 2026-05-25

### Added
- `packages/server/src/routes/sound.ts` — full implementation:
  - **macOS:** `osascript` for get/set volume + mute; `SwitchAudioSource` for device list/switch (degrades gracefully — `brew install switchaudio-osx`)
  - **Windows:** `AudioDeviceCmdlets` PowerShell module preferred; WASAPI inline C# fallback (`IAudioEndpointVolume` via `MMDeviceEnumerator`) when not installed
  - **Windows app mixer:** `IAudioSessionManager2` + `IAudioSessionEnumerator` + `IAudioSessionControl2` + `ISimpleAudioVolume` to enumerate active audio sessions (one row per PID, deduped); process names resolved via single bulk `Get-Process` call
  - New `POST /api/sound/sessions/volume` — sets volume for all sessions matching a PID
  - 5s TTL cache; `cache.clear()` on any successful mutation
- `packages/shared/src/types/sound.ts` — added `AudioSession` interface; added `sessions: AudioSession[]` to `SoundData`
- `apps/renderer/src/widgets/sound/useSound.ts` — TanStack Query hook (5s poll) + mutations for volume, mute, device, session volume; all slider mutations use synchronous optimistic cache updates
- `apps/renderer/src/widgets/sound/SoundWidget.tsx`:
  - Master volume slider + mute toggle (icon morphs Volume→VolumeX)
  - Output device list with active device highlighted; click to switch
  - App Mixer section (Windows only, hidden when `sessions` is empty) — per-app sliders with process name
  - Sliders use persistent `localValue` state synced from parent only when pointer is not down — eliminates snap-back on release regardless of API latency
- `packages/server/src/cache/SimpleCache.ts` — added `clear()` method

### Notes
- **macOS device switching:** requires `brew install switchaudio-osx`
- **Windows device switching:** requires `Install-Module -Name AudioDeviceCmdlets` (once, as admin); volume/mute work without it via WASAPI fallback
- **Windows app mixer:** works without any extra setup via WASAPI

---

## [PR #4]
**Branch:** `feature/sound-widget` → `master`  
**Date:** 2026-05-25

### Added
- `packages/server/src/routes/sound.ts` — full implementation:
  - **macOS:** `osascript` for get/set volume + mute; `SwitchAudioSource` for device list/switch (degrades gracefully to single "Default Output" if not installed — `brew install switchaudio-osx`)
  - **Windows:** `AudioDeviceCmdlets` PowerShell module for get/set volume, mute, device list, and switching; falls back to WASAPI inline C# (`IAudioEndpointVolume` via `MMDeviceEnumerator`) when module is not installed
  - 5s TTL cache; cache busted on any successful mutation
  - Routes: `GET /api/sound`, `POST /api/sound/volume`, `POST /api/sound/mute`, `POST /api/sound/device`
- `apps/renderer/src/widgets/sound/useSound.ts` — TanStack Query hook (5s poll) + 3 mutations (volume, mute, device)
- `apps/renderer/src/widgets/sound/SoundWidget.tsx` — widget UI:
  - Volume slider (native range, styled) — local state while dragging, commits to API on pointer-up
  - Click speaker icon to toggle mute; icon changes between Volume/Volume1/Volume2/VolumeX by level
  - Device list — active device highlighted with green dot; click non-active device to switch

### Changed
- `packages/server/src/cache/SimpleCache.ts` — added `clear()` method for cache busting on mutations

### Notes (Windows)
- Volume/mute works without any extra setup via WASAPI fallback
- Device listing + switching requires `Install-Module -Name AudioDeviceCmdlets` (run once as admin in PowerShell)

---

## [PR #4] feat: stocks widget — Alpaca REST snapshots, card grid UI, editable watchlist
**Branch:** `feature/stocks-widget` → `master`  
**Date:** 2026-05-24

### Added
- `packages/server/src/routes/stocks.ts` — Alpaca IEX REST implementation:
  - Accepts `?symbols=` query param (comma-separated, max 50); defaults to `SPY,QQQ,AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN`
  - Fetches snapshots + 5-minute bars in parallel; bars non-critical (returns empty on failure)
  - Uses `dailyBar.c` as last price, `prevDailyBar.c` as prev close for stable change calculation
  - Market-hours detection via `Intl.DateTimeFormat` with `America/New_York` timezone
  - 5s in-memory cache per symbol set
- `apps/renderer/src/store/stocksStore.ts` — Zustand persist store for watchlist (localStorage)
- `apps/renderer/src/widgets/stocks/useStocks.ts` — TanStack Query, 5s refetch, passes watchlist as query param
- `apps/renderer/src/widgets/stocks/StocksWidget.tsx` — full widget UI:
  - 2-column card grid matching mockup
  - Each card: triangle indicator, ticker, % change (top), Recharts area sparkline (middle), price + dollar change (bottom)
  - Pencil button in header opens watchlist edit modal (add/remove tickers, persisted)
  - Market Open / Market Closed status with animated dot
  - Green/red theming per card based on daily change

### Changed
- `packages/shared/src/types/stocks.ts` — added `sparkline: number[]` to `StockQuote`

### Removed
- `packages/server/src/services/alpacaWs.ts` — WebSocket approach dropped (replaced by REST-only)
- `packages/server/src/services/stocksService.ts` — consolidated into route file

### Notes
- Alpaca IEX feed: US equities only. Futures (MES=F, MGC=F) and crypto (BTC-USD) are not supported; the watchlist edit modal surfaces this caveat

---

## [PR #3] feat: weather widget — Open-Meteo, 15-min cache, full forecast UI
**Branch:** `feature/weather-widget` → `master`  
**Date:** 2026-05-24

### Added
- `packages/server/src/cache/SimpleCache.ts` — generic in-memory TTL cache used by weather (and future widgets)
- `packages/server/src/routes/weather.ts` — fetches Open-Meteo API, transforms to `WeatherData`, caches 15 min
  - Austin TX hardcoded (lat: 30.2672, lon: -97.7431)
  - Returns: current conditions, next 12 hourly entries from now, 5-day daily forecast
  - Temperature in °F, wind in mph, timezone `America/Chicago`
- `apps/renderer/src/widgets/weather/useWeather.ts` — TanStack Query hook, 15-min `refetchInterval` + `staleTime`
- `apps/renderer/src/widgets/weather/weatherCodes.ts` — WMO weather code → `{ label, icon }` map covering all standard codes
- `apps/renderer/src/widgets/weather/WeatherIcon.tsx` — maps icon key to lucide-react component
- `apps/renderer/src/widgets/weather/WeatherWidget.tsx` — full widget UI:
  - Large current temp + condition label + lucide weather icon
  - 4-stat row: humidity, wind speed, precip chance, UV index
  - Feels-like line
  - Horizontal scrollable hourly strip (next 12h) with precip % shown when >20%
  - 5-day daily strip with precip bar and high/low temps

---

## [PR #2] feat: layout engine — resizable/draggable grid with presets
**Branch:** `feature/layout-engine` → `master`  
**Date:** 2026-05-24

### Added
- `react-grid-layout` v1 replacing the static CSS grid in `App.tsx`
- Each widget is independently resizable from all 8 handles (corners + edges)
- Drag-to-reorder via title bar grip — other widgets reflow automatically on every move/resize
- Layout persisted to `localStorage` via Zustand `persist` middleware — survives app restarts
- 4 premade layout presets tuned for 1920×1080, selectable from a fixed top-right toolbar:
  - **Default** — balanced 5-panel split
  - **Stocks Focus** — stocks large left, others right
  - **Media** — Spotify prominent left, everything else right
  - **System** — hardware monitor dominant, stocks full-width bottom
- `WidgetShell` component — title bar with grip icon as drag handle, content fills remaining space
- `LayoutToolbar` component — highlights active preset, switches layout instantly on click
- `DashboardGrid` component — `WidthProvider(ReactGridLayout)` mapping layout items to widget components
- `layoutStore` (Zustand) — `setLayout` / `applyPreset` / `resetToDefault`
- `src/lib/layouts.ts` — all preset definitions, `WidgetId` type, `NamedLayout` interface
- `clsx`, `tailwind-merge`, `lucide-react` added to renderer deps
- `src/lib/utils.ts` — `cn()` helper (clsx + twMerge)
- Dark-themed resize handles — only visible on hover

### Changed
- `App.tsx` — replaced inline static grid with `<DashboardGrid />` + `<LayoutToolbar />`
- `index.css` — added react-grid-layout and react-resizable base styles; custom dark-theme overrides for placeholder and resize handles
- All 4 presets redesigned to be mathematically gap-free — every grid cell covered by exactly one widget, verified column-by-column (sum of `h` values for any column `x` = `numRows`)
- `compactType='vertical'` added — items compact upward on drag so no holes are left behind
- `rowHeight` changed from fixed `40` to dynamic — computed from window height and current layout's max row extent so the grid always fills 100% of the screen; recalculates on window resize

### Fixed
- `react-resizable` added as direct dep — pnpm strict hoisting blocked importing its CSS as a transitive dep of `react-grid-layout`
- Downgraded `react-grid-layout` from v2 (complete API rewrite, no `WidthProvider`) to v1 (stable, documented API); replaced stub `@types/react-grid-layout@2.1.0` with v1 types (`1.3.5`)
- Default preset had a geometric gap in the bottom-right quadrant — all presets now tile without gaps

---

## [PR #1] feat: monorepo scaffold — Electron + Vite + Fastify + Turborepo
**Branch:** `feature/monorepo-scaffold` → `master`  
**Date:** 2026-05-24

### Added
- Turborepo + pnpm workspaces monorepo with 4 packages:
  - `apps/main` — Electron main process (TypeScript, CommonJS)
  - `apps/renderer` — React 18 + Vite + Tailwind frontend
  - `packages/server` — Fastify API server on `localhost:7432`
  - `packages/shared` — shared TypeScript types, single source of truth
- `apps/main/src/index.ts` — BrowserWindow setup, dev (`loadURL :5173`) vs prod (`loadFile`) branching
- `apps/main/src/preload.ts` — typed `contextBridge` IPC via `ElectronAPI` interface from `@dash/shared`
- `apps/main/src/ipc/index.ts` — IPC handlers: `app:minimize`, `app:close`, `spotify:auth-start`
- `apps/main/src/server/spawn.ts` — spawns compiled Fastify server in prod; in dev waits for it via health-check polling
- `tsc-watch --onSuccess "electron ."` dev loop for main process — restarts Electron on successful compile
- `packages/server/src/index.ts` — Fastify with `@fastify/cors`, dotenv, all 5 route namespaces registered
- Route stubs returning 501 for all 5 widgets: weather, spotify, stocks, hardware, sound
- `packages/shared` types:
  - `WeatherData`, `TrackData`, `SpotifyAuthStatus`
  - `StocksData`, `StockQuote`
  - `HardwareData`, `CpuData`, `GpuData`, `DiskIo`, `NetworkIo`
  - `SoundData`, `AudioDevice`
  - `IpcChannels`, `ElectronAPI`
- `apps/renderer/src/lib/apiClient.ts` — typed `get`/`post` wrappers over `fetch` to `localhost:7432`
- `apps/renderer/src/types/electron.d.ts` — `window.electron` typed via `ElectronAPI`
- Placeholder widget shells for all 5 widgets
- TanStack Query v5 `QueryClient` configured in `App.tsx`
- `CLAUDE.md` — auto-loaded project instructions for Claude Code sessions
- `SPEC.md` — full project specification (source of truth for widget behavior)
- `.env.example` with all required keys
- `electron-builder.yml` — packaging config (Windows NSIS, macOS DMG)
- `turbo.json` — build pipeline with `dependsOn: ["^build"]` for correct ordering
- `tsconfig.base.json` — strict TypeScript base config extended by all packages
- `pnpm-workspace.yaml` — workspace + `onlyBuiltDependencies` for electron/esbuild

### Architecture decisions
- All external API calls route through Fastify — renderer never touches secrets directly
- Shared types in `packages/shared` imported by all packages, never redefined
- In dev, Vite alias points `@dash/shared` directly to TypeScript source (skips build step)
- `tsc paths` in main/server tsconfigs point to shared source for type resolution during `tsx watch`

### Changed (vs initial README-only repo)
- Swapped Polygon.io for Alpaca Markets — free IEX WebSocket feed, `ALPACA_API_KEY` + `ALPACA_API_SECRET`
- Spotify redirect URI set to `http://127.0.0.1:7432/spotify/callback` (localhost blocked by Spotify's form)
- `StocksData.futures` field removed — Alpaca has no futures data
- `ALPACA_BASE_URL` added to env template (`https://data.alpaca.markets/v2`)
