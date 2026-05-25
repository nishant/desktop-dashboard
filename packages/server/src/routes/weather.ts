import type { FastifyPluginAsync } from 'fastify';
import type { WeatherData } from '@dash/shared';

export const weatherRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: WeatherData | { error: string } }>('/', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/weather-widget' });
  });
};
