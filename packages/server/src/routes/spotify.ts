import type { FastifyPluginAsync } from 'fastify';
import type { TrackData, SpotifyAuthStatus, SpotifyPlaylist, SpotifyDevice } from '@dash/shared';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SimpleCache } from '../cache/SimpleCache';

// ── Token persistence ─────────────────────────────────────────────────────────
// Stored in ~/.dash/spotify_tokens.json — personal-use app, no sensitive server

const TOKENS_DIR = path.join(os.homedir(), '.dash');
const TOKENS_FILE = path.join(TOKENS_DIR, 'spotify_tokens.json');

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix ms
}

function loadTokens(): StoredTokens | null {
  try {
    const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

function saveTokens(t: StoredTokens): void {
  fs.mkdirSync(TOKENS_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(t), 'utf8');
}

let tokens: StoredTokens | null = loadTokens();

// ── PKCE state ────────────────────────────────────────────────────────────────
// One pending auth at a time — personal app, single user

interface PkceState {
  verifier: string;
  state: string;
  expiresAt: number;
}

let pendingPkce: PkceState | null = null;

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generatePkce(): { verifier: string; challenge: string; state: string } {
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));
  return { verifier, challenge, state };
}

// ── Spotify API helpers ───────────────────────────────────────────────────────

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

function clientId(): string {
  return process.env.SPOTIFY_CLIENT_ID ?? '';
}

function redirectUri(): string {
  return process.env.SPOTIFY_REDIRECT_URI ?? '';
}

async function exchangeCode(code: string, verifier: string): Promise<StoredTokens> {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: clientId(),
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// Returns a valid access token, refreshing if needed. Throws if not authenticated.
async function getValidToken(): Promise<string> {
  if (!tokens) throw new Error('Not authenticated');

  if (Date.now() > tokens.expires_at - 60_000) {
    tokens = await refreshAccessToken(tokens.refresh_token);
    saveTokens(tokens);
  }

  return tokens.access_token;
}

async function spotifyRequest(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  const token = await getValidToken();
  return fetch(`${SPOTIFY_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Caches ────────────────────────────────────────────────────────────────────

const nowPlayingCache = new SimpleCache<TrackData>();          // 2.5s — renderer polls every 3s
const playlistsCache = new SimpleCache<SpotifyPlaylist[]>();   // 30s — changes rarely
const devicesCache = new SimpleCache<SpotifyDevice[]>();       // 5s — active device flips quickly

const NOT_PLAYING: TrackData = {
  isPlaying: false,
  trackId: '',
  trackName: '',
  artistName: '',
  albumName: '',
  albumArtUrl: '',
  durationMs: 0,
  progressMs: 0,
  shuffleState: false,
  repeatState: 'off',
  volumePercent: 0,
};

async function fetchNowPlaying(): Promise<TrackData> {
  const res = await spotifyRequest('GET', '/me/player?additional_types=track');

  if (res.status === 204) return NOT_PLAYING; // no active device

  if (!res.ok) {
    throw new Error(`Spotify player API ${res.status}`);
  }

  const d = await res.json() as {
    is_playing: boolean;
    progress_ms: number;
    shuffle_state: boolean;
    repeat_state: 'off' | 'track' | 'context';
    device?: { volume_percent: number };
    item?: {
      id: string;
      name: string;
      duration_ms: number;
      artists: { name: string }[];
      album: { name: string; images: { url: string; width: number }[] };
    };
  };

  if (!d.item) return { ...NOT_PLAYING, isPlaying: d.is_playing };

  const images = d.item.album.images;
  const albumArtUrl = (images.find((img) => img.width <= 640) ?? images[0])?.url ?? '';

  return {
    isPlaying: d.is_playing,
    trackId: d.item.id,
    trackName: d.item.name,
    artistName: d.item.artists.map((a) => a.name).join(', '),
    albumName: d.item.album.name,
    albumArtUrl,
    durationMs: d.item.duration_ms,
    progressMs: d.progress_ms,
    shuffleState: d.shuffle_state,
    repeatState: d.repeat_state,
    volumePercent: d.device?.volume_percent ?? 0,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const spotifyRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/spotify/auth-url — generates PKCE auth URL; renderer passes it to Electron shell.openExternal
  fastify.get('/auth-url', async (_req, reply) => {
    const { verifier, challenge, state } = generatePkce();
    pendingPkce = { verifier, state, expiresAt: Date.now() + 10 * 60 * 1000 };

    const params = new URLSearchParams({
      client_id: clientId(),
      response_type: 'code',
      redirect_uri: redirectUri(),
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
      scope: SCOPES,
      show_dialog: 'false',
    });

    return reply.send({ url: `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}` });
  });

  // GET /api/spotify/callback — Spotify redirects here after user authorizes
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/callback',
    async (req, reply) => {
      const { code, state, error } = req.query;

      if (error) {
        return reply
          .type('text/html')
          .send(`<html><body><h2>Spotify auth denied: ${error}</h2><p>You can close this tab.</p></body></html>`);
      }

      if (!code || !state || !pendingPkce || pendingPkce.state !== state) {
        return reply.code(400).type('text/html').send(
          '<html><body><h2>Invalid or expired auth request.</h2><p>Try connecting again from the dashboard.</p></body></html>',
        );
      }

      if (Date.now() > pendingPkce.expiresAt) {
        pendingPkce = null;
        return reply.code(400).type('text/html').send(
          '<html><body><h2>Auth request expired.</h2><p>Try connecting again from the dashboard.</p></body></html>',
        );
      }

      try {
        tokens = await exchangeCode(code, pendingPkce.verifier);
        saveTokens(tokens);
        pendingPkce = null;
        nowPlayingCache.clear();
        return reply.type('text/html').send(
          '<html><body><h2>Connected to Spotify!</h2><p>You can close this tab and return to the dashboard.</p></body></html>',
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fastify.log.error(`[spotify] callback error: ${msg}`);
        return reply.code(502).type('text/html').send(
          `<html><body><h2>Token exchange failed.</h2><pre>${msg}</pre></body></html>`,
        );
      }
    },
  );

  // GET /api/spotify/auth-status
  fastify.get<{ Reply: SpotifyAuthStatus }>('/auth-status', async (_req, reply) => {
    return reply.send({ authenticated: tokens !== null });
  });

  // GET /api/spotify/now-playing
  fastify.get<{ Reply: TrackData | { error: string } }>('/now-playing', async (_req, reply) => {
    const cached = nowPlayingCache.get();
    if (cached) return reply.send(cached);

    try {
      const data = await fetchNowPlaying();
      nowPlayingCache.set(data, 2500);
      return reply.send(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.error(`[spotify] ${msg}`);
      return reply.code(502).send({ error: msg });
    }
  });

  // POST /api/spotify/play
  fastify.post('/play', async (_req, reply) => {
    try {
      await spotifyRequest('PUT', '/me/player/play');
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/pause
  fastify.post('/pause', async (_req, reply) => {
    try {
      await spotifyRequest('PUT', '/me/player/pause');
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/next
  fastify.post('/next', async (_req, reply) => {
    try {
      await spotifyRequest('POST', '/me/player/next');
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/previous
  fastify.post('/previous', async (_req, reply) => {
    try {
      await spotifyRequest('POST', '/me/player/previous');
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/seek  body: { positionMs: number }
  fastify.post<{ Body: { positionMs: number } }>('/seek', async (req, reply) => {
    try {
      const { positionMs } = req.body;
      await spotifyRequest('PUT', `/me/player/seek?position_ms=${Math.round(positionMs)}`);
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/volume  body: { volumePercent: number }
  fastify.post<{ Body: { volumePercent: number } }>('/volume', async (req, reply) => {
    try {
      const vol = Math.min(100, Math.max(0, Math.round(req.body.volumePercent)));
      await spotifyRequest('PUT', `/me/player/volume?volume_percent=${vol}`);
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/shuffle  body: { state: boolean }
  fastify.post<{ Body: { state: boolean } }>('/shuffle', async (req, reply) => {
    try {
      await spotifyRequest('PUT', `/me/player/shuffle?state=${req.body.state}`);
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // POST /api/spotify/repeat  body: { state: 'off' | 'track' | 'context' }
  fastify.post<{ Body: { state: 'off' | 'track' | 'context' } }>('/repeat', async (req, reply) => {
    try {
      await spotifyRequest('PUT', `/me/player/repeat?state=${req.body.state}`);
      nowPlayingCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });

  // GET /api/spotify/playlists
  fastify.get<{ Reply: SpotifyPlaylist[] | { error: string } }>('/playlists', async (_req, reply) => {
    const cached = playlistsCache.get();
    if (cached) return reply.send(cached);

    try {
      const res = await spotifyRequest('GET', '/me/playlists?limit=50');
      if (!res.ok) throw new Error(`Spotify playlists API ${res.status}`);

      const d = await res.json() as {
        items: {
          id: string;
          name: string;
          images: { url: string; width: number | null }[];
          tracks: { total: number };
          uri: string;
        }[];
      };

      const playlists: SpotifyPlaylist[] = (d.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.images?.[0]?.url ?? null,
        trackCount: p.tracks?.total ?? 0,
        uri: p.uri,
      }));

      playlistsCache.set(playlists, 30_000);
      return reply.send(playlists);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.error(`[spotify] playlists: ${msg}`);
      return reply.code(502).send({ error: msg });
    }
  });

  // GET /api/spotify/devices
  fastify.get<{ Reply: SpotifyDevice[] | { error: string } }>('/devices', async (_req, reply) => {
    const cached = devicesCache.get();
    if (cached) return reply.send(cached);

    try {
      const res = await spotifyRequest('GET', '/me/player/devices');
      if (!res.ok) throw new Error(`Spotify devices API ${res.status}`);

      const d = await res.json() as {
        devices: {
          id: string;
          name: string;
          type: string;
          is_active: boolean;
          volume_percent: number | null;
        }[];
      };

      const devices: SpotifyDevice[] = (d.devices ?? []).map((dev) => ({
        id: dev.id,
        name: dev.name,
        type: dev.type,
        isActive: dev.is_active,
        volumePercent: dev.volume_percent,
      }));

      devicesCache.set(devices, 5_000);
      return reply.send(devices);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      fastify.log.error(`[spotify] devices: ${msg}`);
      return reply.code(502).send({ error: msg });
    }
  });

  // POST /api/spotify/play-context  body: { contextUri: string; deviceId?: string }
  fastify.post<{ Body: { contextUri: string; deviceId?: string } }>('/play-context', async (req, reply) => {
    try {
      const { contextUri, deviceId } = req.body;
      const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
      const res = await spotifyRequest('PUT', `/me/player/play${qs}`, {
        context_uri: contextUri,
        offset: { position: 0 },
        position_ms: 0,
      });

      // 204 = success, 202 = accepted (device waking), 404 = no active device
      if (res.status === 404) {
        devicesCache.clear();
        return reply.code(404).send({ error: 'No active device — open Spotify on a device first' });
      }
      if (!res.ok && res.status !== 202) {
        const body = await res.text();
        return reply.code(502).send({ error: `Spotify ${res.status}: ${body}` });
      }

      nowPlayingCache.clear();
      devicesCache.clear();
      return reply.code(204).send();
    } catch (err) {
      return reply.code(502).send({ error: String(err) });
    }
  });
};
