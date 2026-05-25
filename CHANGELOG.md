# Changelog

All changes organized by pull request, newest first.

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
