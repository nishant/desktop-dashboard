import type { FastifyPluginAsync } from 'fastify';
import type { StocksData } from '@dash/shared';

export const stocksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: StocksData | { error: string } }>('/', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/stocks-widget' });
  });
};
