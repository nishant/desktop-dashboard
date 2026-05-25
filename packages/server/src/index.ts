import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { resolve } from 'path';
import { weatherRoutes } from './routes/weather';
import { spotifyRoutes } from './routes/spotify';
import { stocksRoutes } from './routes/stocks';
import { hardwareRoutes } from './routes/hardware';
import { soundRoutes } from './routes/sound';

// CWD is packages/server when run via Turborepo — walk up to monorepo root
config({ path: resolve(__dirname, '../../../.env') });

const server = Fastify({ logger: { level: 'info' } });

const port = Number(process.env.SERVER_PORT ?? 7432);

async function start(): Promise<void> {
  await server.register(cors, { origin: ['http://localhost:5173', 'file://'] });

  server.register(weatherRoutes, { prefix: '/api/weather' });
  server.register(spotifyRoutes, { prefix: '/api/spotify' });
  server.register(stocksRoutes, { prefix: '/api/stocks' });
  server.register(hardwareRoutes, { prefix: '/api/hardware' });
  server.register(soundRoutes, { prefix: '/api/sound' });

  server.get('/health', async () => ({ status: 'ok' }));

  await server.listen({ port, host: '127.0.0.1' });
}

start().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
