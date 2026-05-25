# Dashboard App — Project Specification

## Overview

A personal ambient desktop dashboard built with Electron + React, designed to run all day on a secondary monitor. Displays live system data, market data, media controls, and environmental info in a single always-on window.

**Owner:** Nish  
**Platform:** Windows (primary), macOS (secondary)  
**Purpose:** Personal use only — no auth, no multi-user, no backend deployment

---

## Tech Stack

### Desktop Shell
- **Electron** (latest stable)
- Main process: TypeScript
- Renderer: React via Vite (loaded via `loadURL` in dev, `loadFile` in prod)
- IPC: `contextBridge` + typed `ipcRenderer`/`ipcMain` wrappers

### Frontend (apps/renderer)
- **React 18** + **TypeScript** (strict mode)
- **Vite** for bundling
- **Tailwind CSS** for styling
- **shadcn/ui** for base components (Dialog, Tooltip, Slider, Toggle, etc.)
- **Zustand** for global state (one store per widget domain)
- **TanStack Query (React Query v5)** for all data fetching, polling, caching
- **Recharts** for sparklines and time-series graphs

### Local Backend (packages/server)
- **Fastify** + **TypeScript**
- Runs as a child process spawned by Electron main
- All external API calls go through here (secrets never reach renderer)
- Communicates with renderer via HTTP on `localhost:7432`
- Communicates with Electron main via IPC for OS-level operations

### Monorepo
- **Turborepo**
- **pnpm** workspaces
- Packages: `apps/renderer`, `apps/main`, `packages/server`, `packages/shared`

### Shared Package (packages/shared)
- TypeScript types shared across all packages
- API response interfaces, widget config types, store shape types

---

## Project Structure

```
dashboard/
├── apps/
│   ├── renderer/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── widgets/
│   │   │   │   ├── weather/       # WeatherWidget.tsx + store + hooks
│   │   │   │   ├── spotify/       # SpotifyWidget.tsx + store + hooks
│   │   │   │   ├── stocks/        # StocksWidget.tsx + store + hooks
│   │   │   │   ├── hardware/      # HardwareWidget.tsx + store + hooks
│   │   │   │   └── sound/         # SoundWidget.tsx + store + hooks
│   │   │   ├── components/        # Shared UI components (shadcn + custom)
│   │   │   ├── store/             # Zustand stores
│   │   │   ├── hooks/             # Shared hooks (usePolling, useWebSocket, etc.)
│   │   │   ├── lib/               # API client, utils, constants
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── main/                      # Electron main process
│       ├── src/
│       │   ├── ipc/               # IPC handler registration
│       │   ├── server/            # Fastify child process spawn logic
│       │   └── index.ts           # BrowserWindow setup, app lifecycle
│       └── tsconfig.json
├── packages/
│   ├── server/                    # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── weather.ts
│   │   │   │   ├── spotify.ts
│   │   │   │   ├── stocks.ts
│   │   │   │   ├── hardware.ts
│   │   │   │   └── sound.ts
│   │   │   ├── pollers/           # Background polling workers
│   │   │   ├── cache/             # In-memory cache layer
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   └── shared/                    # Shared TypeScript types
│       └── src/
│           ├── types/
│           └── index.ts
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── SPEC.md
```

---

## Widgets

### 1. Weather
- **API:** Open-Meteo (free, no key required)
- **Data:** Current temp, feels like, humidity, wind speed, UV index, precipitation chance, hourly forecast (next 12h), daily forecast (next 5 days)
- **Poll interval:** 15 minutes
- **Location:** Hardcoded to Austin, TX (lat: 30.2672, lon: -97.7431)
- **Cache TTL:** 15 minutes

### 2. Spotify Now Playing
- **API:** Spotify Web API
- **Auth:** OAuth 2.0 PKCE flow; refresh token persisted via Electron `safeStorage`
- **Data:** Track name, artist, album art, duration, progress, shuffle/repeat state
- **Controls:** Play/pause, skip forward/back, seek, volume, shuffle toggle
- **Poll interval:** 3 seconds (REST polling, not WebSocket)
- **Scopes needed:** `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`

### 3. Stocks
- **API:** Alpaca Markets
- **Auth:** API key + secret via `.env` (`ALPACA_API_KEY`, `ALPACA_API_SECRET`)
- **Tickers to display:** Configurable list in user config file
- **Data per ticker:** Last price, change $, change %, bid, ask, volume, day high/low
- **Real-time:** Alpaca WebSocket (`wss://stream.data.alpaca.markets/v2/iex`) for equity quotes
- **Poll fallback:** REST every 5s if WebSocket disconnects (`https://data.alpaca.markets/v2`)
- **Market hours awareness:** Show "Market Closed" state outside RTH; display last close price
- **Note:** IEX feed (free tier) — real-time prices from IEX exchange, no futures data

### 4. Hardware Usage
- **Library:** `systeminformation` npm package
- **Data:**
  - CPU: overall %, per-core %, clock speed, temperature
  - GPU: usage %, VRAM used/total, temperature (NVIDIA via nvidia-smi)
  - RAM: used, total, % used
  - Disk: read/write MB/s per drive
  - Network: upload/download Mbps per adapter
- **Poll interval:** 1 second
- **Display:** Current value + 60-second sparkline per metric

### 5. Sound Control
- **Windows:**
  - Get/set master volume via PowerShell `Get-AudioDevice` / `Set-AudioDevice` (AudioDeviceCmdlets module) or WASAPI via `child_process`
  - List and switch default playback device
- **macOS:**
  - Volume via `osascript -e 'set volume output volume X'`
  - Device switching via `SwitchAudioSource` CLI
- **Data:** Current volume %, mute state, active output device name, available devices list
- **Poll interval:** 5 seconds

---

## Data Flow

```
Renderer (React)
  └── TanStack Query hooks
        └── HTTP GET → localhost:7432
              └── Fastify server
                    ├── Weather    → Open-Meteo REST
                    ├── Spotify    → Spotify Web API REST
                    ├── Stocks     → Alpaca WebSocket IEX (persistent connection)
                    ├── Hardware   → systeminformation (local)
                    └── Sound      → child_process (PowerShell / osascript)

Renderer (React)
  └── Zustand store
        └── IPC call → Electron main
              └── OS-level operations (safeStorage, app control, etc.)
```

---

## Environment Variables

```env
# .env (never committed)
ALPACA_API_KEY=
ALPACA_API_SECRET=
ALPACA_BASE_URL=https://data.alpaca.markets/v2
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:7432/spotify/callback
SERVER_PORT=7432
```

Secrets loaded by Fastify server only. Renderer never sees them.

---

## IPC Channels (Electron Main ↔ Renderer)

| Channel | Direction | Purpose |
|---|---|---|
| `app:minimize` | R → M | Minimize window |
| `app:close` | R → M | Quit app |
| `spotify:token-store` | M → R | Notify token saved |
| `spotify:auth-start` | R → M | Open OAuth browser window |

---

## Polling Strategy Summary

| Widget | Method | Interval |
|---|---|---|
| Stocks (equity) | Alpaca WebSocket IEX | Real-time |
| Stocks (fallback) | Alpaca REST | 5s |
| Spotify | REST | 3s |
| Hardware | systeminformation | 1s |
| Weather | REST | 15min |
| Sound | OS poll | 5s |

---

## Naming & Code Conventions

- **Files:** `PascalCase` for components, `camelCase` for utils/hooks/stores
- **Hooks:** prefix `use` — e.g. `useSpotifyPlayer`, `useHardwareStats`
- **Stores:** suffix `Store` — e.g. `useStocksStore`, `useWeatherStore`
- **API routes:** REST, lowercase kebab — e.g. `/api/weather`, `/api/spotify/now-playing`
- **Types:** Suffix `Data` for API response shapes — e.g. `WeatherData`, `TrackData`
- **No default exports** on stores or hooks — named exports only
- **Strict TypeScript** — no `any`, no `as` casting unless unavoidable with comment

---

## Build & Dev

```bash
# Install
pnpm install

# Dev (starts Vite + Fastify + Electron concurrently)
pnpm dev

# Build
pnpm build

# Package (electron-builder)
pnpm package
```

---

## Out of Scope (for now)

- Authentication / user accounts
- Cloud sync
- Mobile / web version
- Notifications / alerts (phase 2)
- Google Calendar widget (phase 2)
- News feed (phase 2)
- Custom widget config UI (phase 2)
