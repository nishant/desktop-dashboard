import type { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeMessage } from '@dash/shared';

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-5';
const MAX_TOKENS = 2048;

// Lazy-init so missing key doesn't crash the server at startup.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function claudeRoutes(fastify: FastifyInstance): Promise<void> {
  /** POST /api/claude/chat
   *  Body: { messages: ClaudeMessage[] }
   *  Response: SSE stream — data: {"text":"..."} chunks, then data: [DONE]
   */
  fastify.post<{ Body: { messages: ClaudeMessage[] } }>('/chat', async (req, reply) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    let client: Anthropic;
    try {
      client = getClient();
    } catch {
      return reply.code(503).send({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: 'You are a helpful assistant embedded in a personal dashboard. Be concise.',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          reply.raw.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.raw.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    }

    reply.raw.write('data: [DONE]\n\n');
    reply.raw.end();
  });
}
