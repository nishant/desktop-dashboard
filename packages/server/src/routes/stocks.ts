import type { FastifyPluginAsync } from 'fastify';
import type { StocksData } from '@dash/shared';
import { getStocksDataFresh, startWs } from '../services/stocksService';

let wsStarted = false;

export const stocksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onReady', async () => {
    if (!wsStarted) {
      wsStarted = true;
      startWs();
    }
  });

  fastify.get<{ Reply: StocksData | { error: string } }>('/', async (_req, reply) => {
    try {
      const data = await getStocksDataFresh();
      return reply.send(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.code(502).send({ error: msg });
    }
  });
};
