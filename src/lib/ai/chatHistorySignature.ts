import 'server-only';

import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { UIMessageChunk } from 'ai';
import { z } from 'zod';

import { resolveSupabaseSecretKey } from '@/lib/supabase/config';
import { env } from '@/env';

import { fitChatContext, type ChatTextMessage } from './chatMessages';

const HISTORY_TTL_SECONDS = 30 * 24 * 60 * 60;
const payloadSchema = z.strictObject({
  v: z.literal(1),
  sub: z.string().min(1),
  cid: z.uuid(),
  exp: z.number().int(),
  hash: z.string(),
  truncated: z.boolean(),
});

export type ChatHistoryIdentity = { conversationId: string; truncated: boolean };

export function getChatHistorySecret(): string | undefined {
  const secret = resolveSupabaseSecretKey(env);
  // Derive a purpose-specific key instead of using the credential directly for transcript MACs.
  return secret
    ? createHmac('sha256', secret).update('tjwiki:chat-history:v1').digest('base64url')
    : undefined;
}

// Explicit tuples make the digest independent of JSON object property order and metadata.
const historyHash = (messages: readonly ChatTextMessage[]) =>
  createHash('sha256')
    .update(JSON.stringify(messages.map(({ id, role, parts }) => [id, role, parts[0]!.text])))
    .digest('base64url');

export function signChatHistory(
  messages: readonly ChatTextMessage[],
  userId: string,
  secret: string,
  identity: ChatHistoryIdentity,
  now = Date.now()
) {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      sub: userId,
      cid: identity.conversationId,
      exp: Math.floor(now / 1000) + HISTORY_TTL_SECONDS,
      hash: historyHash(messages),
      truncated: identity.truncated,
    })
  ).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}

export function verifyChatHistory(
  messages: readonly ChatTextMessage[],
  token: string | undefined,
  userId: string,
  secret: string,
  now = Date.now()
): ChatHistoryIdentity | null {
  if (!token)
    return messages.length === 0 ? { conversationId: randomUUID(), truncated: false } : null;
  if (token.length > 2048 || !/^[\w-]+\.[\w-]+$/.test(token) || messages.length === 0) return null;
  const [payload, signature] = token.split('.') as [string, string];
  const actual = Buffer.from(signature, 'base64url');
  const expected = createHmac('sha256', secret).update(payload).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const decoded = payloadSchema.safeParse(
      JSON.parse(Buffer.from(payload, 'base64url').toString())
    );
    if (!decoded.success) return null;
    const value = decoded.data;
    if (
      value.sub !== userId ||
      value.exp <= Math.floor(now / 1000) ||
      value.hash !== historyHash(messages)
    )
      return null;
    return { conversationId: value.cid, truncated: value.truncated };
  } catch {
    // An authenticated token with an incompatible payload is still unusable.
    return null;
  }
}

/** Sign the exact visible text emitted by the SDK, only when generation finishes successfully. */
export function signChatStream(
  stream: ReadableStream<UIMessageChunk>,
  messages: ChatTextMessage[],
  userId: string,
  secret: string,
  identity: ChatHistoryIdentity,
  signal?: AbortSignal
) {
  let responseId: string | undefined;
  const textParts = new Map<string, string>();
  let failed = false;
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        if (chunk.type === 'start') responseId = chunk.messageId;
        if (chunk.type === 'text-start') textParts.set(chunk.id, '');
        if (chunk.type === 'text-delta')
          textParts.set(chunk.id, (textParts.get(chunk.id) ?? '') + chunk.delta);
        if (chunk.type === 'error' || chunk.type === 'abort') failed = true;
        const text = chunk.type === 'finish' ? [...textParts.values()].join('') : '';
        if (
          chunk.type === 'finish' &&
          !failed &&
          !signal?.aborted &&
          responseId &&
          text &&
          chunk.finishReason !== 'error' &&
          chunk.finishReason !== 'other'
        ) {
          const context = fitChatContext([
            ...messages,
            { id: responseId, role: 'assistant', parts: [{ type: 'text', text }] },
          ]);
          const truncated = identity.truncated || context.truncated;
          chunk = {
            ...chunk,
            messageMetadata: {
              history: {
                token: signChatHistory(context.messages, userId, secret, {
                  ...identity,
                  truncated,
                }),
                messageIds: context.messages.map((message) => message.id),
                truncated,
              },
            },
          };
        }
        controller.enqueue(chunk);
      },
    })
  );
}
