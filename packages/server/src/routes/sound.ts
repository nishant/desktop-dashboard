import type { FastifyPluginAsync } from 'fastify';
import type { SoundData } from '@dash/shared';

export const soundRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: SoundData | { error: string } }>('/', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/sound-widget' });
  });

  fastify.post<{ Body: { volumePercent: number } }>('/volume', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/sound-widget' });
  });

  fastify.post<{ Body: { deviceId: string } }>('/device', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/sound-widget' });
  });
};
