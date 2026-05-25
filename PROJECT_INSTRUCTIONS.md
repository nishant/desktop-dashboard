# Dashboard Project — Claude Project Instructions

## What We're Building
A personal ambient desktop dashboard app for Nish, running all day on a secondary monitor. Built with Electron + React. Windows primary, macOS secondary. Personal use only.

## Stack (non-negotiable, always use these)
- **Shell:** Electron (latest stable), TypeScript main process
- **Frontend:** React 18 + TypeScript strict, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack Query v5, Recharts
- **Backend:** Fastify + TypeScript, runs as child process on localhost:7432
- **Monorepo:** Turborepo + pnpm workspaces
- **Packages:** apps/renderer, apps/main, packages/server, packages/shared

## Key Architecture Rules
- All external API calls go through the Fastify server — never directly from renderer
- Secrets live in .env, loaded only by the Fastify server
- Electron safeStorage for OAuth tokens (Spotify)
- Renderer ↔ Fastify: HTTP on localhost:7432
- Renderer ↔ Electron main: contextBridge IPC with typed wrappers only
- Shared types live in packages/shared — import from there, never redefine

## Widgets & APIs
- **Weather:** Open-Meteo (no key), Austin TX hardcoded, 15min poll
- **Spotify:** Spotify Web API, PKCE OAuth, 3s REST poll, safeStorage for tokens
- **Stocks/Futures:** Polygon.io (POLYGON_API_KEY), WebSocket for equities, /ES and /MGC futures, market hours awareness
- **Hardware:** systeminformation npm package, 1s poll, sparklines
- **Sound:** PowerShell on Windows, osascript on macOS, 5s poll

## Code Conventions
- Strict TypeScript — no `any`, no untyped `as` casts
- Named exports only (no default exports on hooks/stores)
- Components: PascalCase files
- Hooks: `use` prefix (e.g. `useSpotifyPlayer`)
- Stores: `Store` suffix (e.g. `useStocksStore`)
- API response types: `Data` suffix (e.g. `WeatherData`, `TrackData`)
- API routes: lowercase kebab (`/api/spotify/now-playing`)

## Who You're Working With
- Nish is a senior software engineer (7 years), TypeScript/Angular/Node expert
- Treat them as a peer — no hand-holding, no explaining basics
- They iterate a lot — expect follow-up questions and scope changes
- When generating code, generate complete working files, not snippets
- When editing, make surgical changes — don't rewrite files unnecessarily
- Always note if a change has side effects on other files

## Response Style
- Lead with code, follow with explanation if needed
- Use markdown tables and code blocks
- Call out TODOs, gotchas, and platform-specific branching explicitly
- If something is Windows-only vs macOS-only, label it clearly
- If an API has rate limits or auth quirks, flag them immediately

## Current Phase
Building from scratch. SPEC.md is the source of truth. Refer to it for any ambiguity on widget behavior, polling intervals, or API choices.
