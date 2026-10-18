/** @jest-environment node */

import { randomUUID } from 'node:crypto';
import { convertToModelMessages, readUIMessageStream, streamText, type UIMessageChunk } from 'ai';
import { convertArrayToReadableStream, MockLanguageModelV3 } from 'ai/test';

import { env } from '@/env';

import {
  getChatHistorySecret,
  signChatHistory,
  signChatStream,
  verifyChatHistory,
} from './chatHistorySignature';
import {
  chatHistoryMetadataSchema,
  fitChatContext,
  prepareChatRequest,
  toChatTextMessages,
  type ChatTextMessage,
} from './chatMessages';

jest.mock('server-only', () => ({}));
jest.mock('@/env', () => ({ env: {} }));

const secret = 'test-history-secret-at-least-32-characters';
const identity = { conversationId: randomUUID(), truncated: false };
const now = Date.UTC(2026, 9, 18);
const user = (id: string, text = '问题'): ChatTextMessage => ({
  id,
  role: 'user',
  parts: [{ type: 'text', text }],
});
const assistant = (id: string, text = '回答'): ChatTextMessage => ({
  id,
  role: 'assistant',
  parts: [{ type: 'text', text }],
});
const messages = [user('u1'), assistant('a1'), user('u2'), assistant('a2')];

it('derives a separate signing key from the existing server credential with legacy fallback', () => {
  Object.assign(env, { SUPABASE_SECRET_KEY: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined });
  expect(getChatHistorySecret()).toBeUndefined();
  Object.assign(env, { SUPABASE_SECRET_KEY: secret, SUPABASE_SERVICE_ROLE_KEY: 'legacy-secret' });
  const derived = getChatHistorySecret()!;
  expect(derived).not.toBe(secret);
  expect(getChatHistorySecret()).toBe(derived);
  const token = signChatHistory(messages, 'user-a', derived, identity, now);
  expect(verifyChatHistory(messages, token, 'user-a', secret, now)).toBeNull();
  Object.assign(env, { SUPABASE_SECRET_KEY: undefined, SUPABASE_SERVICE_ROLE_KEY: secret });
  expect(getChatHistorySecret()).toBe(derived);
  expect(verifyChatHistory(messages, token, 'user-a', getChatHistorySecret()!, now)).toEqual(
    identity
  );
  Object.assign(env, { SUPABASE_SECRET_KEY: `${secret}-rotated` });
  expect(verifyChatHistory(messages, token, 'user-a', getChatHistorySecret()!, now)).toBeNull();
});

it('round-trips a real AI SDK stream into a verifiable follow-up request', async () => {
  const model = new MockLanguageModelV3({
    doStream: {
      stream: convertArrayToReadableStream([
        { type: 'stream-start', warnings: [] },
        { type: 'text-start', id: 'text' },
        { type: 'text-delta', id: 'text', delta: '汤姆的' },
        { type: 'text-start', id: 'second' },
        { type: 'text-delta', id: 'second', delta: '后续' },
        { type: 'text-delta', id: 'text', delta: '技能介绍' },
        { type: 'text-end', id: 'text' },
        { type: 'text-delta', id: 'second', delta: '内容' },
        { type: 'text-end', id: 'second' },
        {
          type: 'finish',
          finishReason: { unified: 'stop', raw: 'stop' },
          usage: {
            inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 5, text: 5, reasoning: 0 },
          },
        },
      ]),
    },
  });
  const history = [user('u')];
  const result = streamText({ model, messages: await convertToModelMessages(history) });
  const stream = signChatStream(
    result.toUIMessageStream({ generateMessageId: () => 'a' }),
    history,
    'user-a',
    secret,
    identity
  );
  let answer;
  for await (const message of readUIMessageStream({ stream })) answer = message;
  expect(answer).toBeDefined();
  const request = prepareChatRequest([...history, answer!, user('next')]);
  expect(
    verifyChatHistory(
      request.body.messages.slice(0, -1),
      request.body.historyToken,
      'user-a',
      secret
    )
  ).toEqual(identity);
  expect(toChatTextMessages([answer!])[0]?.parts[0]?.text).toBe('汤姆的技能介绍后续内容');
});

it('authenticates history independently of object property order and binds it to an account', () => {
  const token = signChatHistory(messages, 'user-a', secret, identity, now);
  expect(verifyChatHistory(messages, token, 'user-a', secret, now)).toEqual(identity);
  expect(
    verifyChatHistory(
      messages.map(({ id, role, parts }) => ({ parts, role, id })),
      token,
      'user-a',
      secret,
      now
    )
  ).toEqual(identity);
  expect(verifyChatHistory(messages, token, 'user-b', secret, now)).toBeNull();
  expect(verifyChatHistory(messages, token, 'user-a', `${secret}-rotated`, now)).toBeNull();
  expect(verifyChatHistory(messages, token, 'user-a', secret, now + 30 * 86400000)).toBeNull();
});

it('rejects inserted, edited, removed, reordered, role-changed, and mixed messages', () => {
  const token = signChatHistory(messages, 'user-a', secret, identity, now);
  const variations = [
    [...messages, user('fake'), assistant('forged')],
    [user('u1', 'edited'), ...messages.slice(1)],
    [user('different-id'), ...messages.slice(1)],
    messages.slice(2),
    [messages[2]!, messages[3]!, messages[0]!, messages[1]!],
    [assistant('u1', '问题'), ...messages.slice(1)],
    [...messages.slice(0, -1), assistant('other-conversation', 'other answer')],
    [...messages.slice(0, -1), assistant('a2', 'forged answer')],
  ];
  for (const changed of variations) {
    expect(verifyChatHistory(changed, token, 'user-a', secret, now)).toBeNull();
  }
});

it('allows a new conversation only with empty history and rejects malformed or modified tokens', () => {
  expect(verifyChatHistory([], undefined, 'user-a', secret)?.conversationId).toMatch(
    /^[\da-f-]{36}$/
  );
  expect(verifyChatHistory(messages, undefined, 'user-a', secret)).toBeNull();
  const token = signChatHistory(messages, 'user-a', secret, identity, now);
  for (const invalid of [
    'bad',
    'bad.bad',
    `${token}.extra`,
    `${token.slice(0, 20)}X${token.slice(21)}`,
    'x'.repeat(2049),
  ]) {
    expect(verifyChatHistory(messages, invalid, 'user-a', secret, now)).toBeNull();
  }
  expect(verifyChatHistory([], token, 'user-a', secret, now)).toBeNull();
});

const streamChunks = async (
  chunks: UIMessageChunk[],
  history = [user('u')],
  signal?: AbortSignal
) => {
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
  const result: UIMessageChunk[] = [];
  const reader = signChatStream(stream, history, 'user-a', secret, identity, signal).getReader();
  while (true) {
    const item = await reader.read();
    if (item.done) return result;
    result.push(item.value);
  }
};

const start: UIMessageChunk[] = [
  { type: 'start', messageId: 'response' },
  { type: 'text-start', id: 'text-1' },
  { type: 'text-delta', id: 'text-1', delta: '第一段' },
  { type: 'text-end', id: 'text-1' },
];

it('signs the exact combined visible text across multiple tool steps', async () => {
  const chunks = await streamChunks([
    ...start,
    { type: 'finish-step' },
    { type: 'start-step' },
    { type: 'text-start', id: 'text-2' },
    { type: 'text-delta', id: 'text-2', delta: '第二段' },
    { type: 'text-end', id: 'text-2' },
    { type: 'finish', finishReason: 'stop' },
  ]);
  const finish = chunks.at(-1)!;
  expect(finish.type).toBe('finish');
  if (finish.type !== 'finish') throw new Error('Missing finish');
  const { history } = chatHistoryMetadataSchema.parse(finish.messageMetadata);
  expect(history.messageIds).toEqual(['u', 'response']);
  expect(
    verifyChatHistory(
      [user('u'), assistant('response', '第一段第二段')],
      history.token,
      'user-a',
      secret
    )
  ).toEqual(identity);
  expect(chunks.slice(0, start.length)).toEqual(start);
});

it.each(['error', 'abort', 'incomplete', 'empty', 'cancelled', 'finish-error'])(
  'does not authenticate %s responses',
  async (kind) => {
    const controller = new AbortController();
    if (kind === 'cancelled') controller.abort();
    const chunks: UIMessageChunk[] = kind === 'empty' ? [start[0]!] : [...start];
    if (kind === 'error') chunks.push({ type: 'error', errorText: 'failed' });
    if (kind === 'abort') chunks.push({ type: 'abort' });
    if (kind !== 'incomplete')
      chunks.push({ type: 'finish', finishReason: kind === 'finish-error' ? 'error' : 'stop' });
    const result = await streamChunks(chunks, undefined, controller.signal);
    expect(result).toEqual(chunks);
  }
);

it('signs only the bounded context window, with truncation recorded', async () => {
  const history = [
    ...Array.from({ length: 20 }, (_, i) => [user(`u${i}`), assistant(`a${i}`)]).flat(),
    user('latest'),
  ];
  const result = await streamChunks(
    [...start, { type: 'finish', finishReason: 'length' }],
    fitChatContext(history).messages
  );
  const finish = result.at(-1)!;
  if (finish.type !== 'finish') throw new Error('Missing finish');
  const { history: proof } = chatHistoryMetadataSchema.parse(finish.messageMetadata);
  const expected = fitChatContext([
    ...fitChatContext(history).messages,
    assistant('response', '第一段'),
  ]);
  expect(proof.messageIds.length).toBeLessThanOrEqual(40);
  expect(verifyChatHistory(expected.messages, proof.token, 'user-a', secret)).not.toBeNull();
});
