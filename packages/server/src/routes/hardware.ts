import type { FastifyPluginAsync } from 'fastify';
import type { HardwareData } from '@dash/shared';

export const hardwareRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: HardwareData | { error: string } }>('/', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/hardware-widget' });
  });
};
