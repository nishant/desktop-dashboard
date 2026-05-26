# Dashboard Project — Claude Instructions

> Full spec: [SPEC.md](./SPEC.md) — source of truth for widget behavior, polling intervals, API choices.

## What We're Building
Personal ambient desktop dashboard for Nish, running all day on a secondary monitor. Electron + React. Windows primary, macOS secondary. Personal use only.

## Stack (non-negotiable)
- **Shell:** Electron (latest stable), TypeScript main process
- **Frontend:** React 18 + TypeScript strict, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack Query v5, Recharts
- **Backend:** Fastify + TypeScript, runs as child process on localhost:7432
- **Monorepo:** Turborepo + pnpm workspaces
- **Packages:** `apps/renderer`, `apps/main`, `packages/server`, `packages/shared`

## Architecture Rules
- All external API calls go through Fastify — never directly from renderer
- Secrets in `.env`, loaded only by Fastify server
- Electron `safeStorage` for OAuth tokens (Spotify)
- Renderer ↔ Fastify: HTTP on localhost:7432
- Renderer ↔ Electron main: contextBridge IPC with typed wrappers only
- Shared types live in `packages/shared` — import from there, never redefine

## Widgets & APIs
| Widget | API | Key | Interval |
|---|---|---|---|
| Weather | Open-Meteo | none | 15min |
| Spotify | Spotify Web API | PKCE OAuth | 3s REST |
| Stocks | Alpaca Markets WebSocket (IEX) | ALPACA_API_KEY + ALPACA_API_SECRET | real-time / 5s fallback |
| Hardware | systeminformation | none | 1s |
| Sound | PowerShell (Win) / osascript (mac) | none | 5s |

## Code Conventions
- Strict TypeScript — no `any`, no untyped `as` casts
- Named exports only (no default exports on hooks/stores)
- Components: `PascalCase` files
- Hooks: `use` prefix — e.g. `useSpotifyPlayer`
- Stores: `Store` suffix — e.g. `useStocksStore`
- API response types: `Data` suffix — e.g. `WeatherData`, `TrackData`
- API routes: lowercase kebab — `/api/spotify/now-playing`

## Working With Nish
- Senior software engineer (7 years), TypeScript/Angular/Node expert — no hand-holding
- Generate complete working files, not snippets
- Make surgical edits — don't rewrite files unnecessarily
- Always note side effects on other files

## Response Style
- Lead with code, follow with explanation if needed
- Call out TODOs, gotchas, and platform-specific branching explicitly
- Label Windows-only vs macOS-only behavior clearly
- Flag API rate limits or auth quirks immediately

## Git Workflow
1. **Branch first** — `git checkout -b <branch>` before touching any files. Never make changes on `master` then branch for the PR.
2. **Update CHANGELOG.md** on the branch before opening the PR. New entries go at the top (newest first). Cover every meaningful change and architectural decision.
3. **Commit, push, `gh pr create`, merge** — in that order.
4. Branch naming: `feat/<slug>` for features, `fix/<slug>` for fixes.

## Memory Protocol
When Nish gives feedback or states a preference, add it to **both**:
- `CLAUDE.md` (this file, committed — travels with the repo to all machines)
- `~/.claude/projects/-Users-nishant-Code-desktop-dashboard/memory/` (local auto-memory for this machine)
