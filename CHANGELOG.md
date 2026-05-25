# Changelog

All changes organized by pull request, newest first.

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
