import type { FastifyPluginAsync } from 'fastify';
import type { TrackData, SpotifyAuthStatus } from '@dash/shared';

export const spotifyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Reply: TrackData | { error: string } }>('/now-playing', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.get('/auth-status', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.get('/callback', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.post('/play', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.post('/pause', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.post('/next', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });

  fastify.post('/previous', async (_req, reply) => {
    return reply.code(501).send({ error: 'Not implemented — see feature/spotify-widget' });
  });
};
