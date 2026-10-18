import type { UIMessage } from 'ai';

import {
  CHAT_MAX_MESSAGE_BYTES,
  CHAT_MAX_MESSAGES,
  chatRequestSchema,
  fitChatContext,
  prepareChatRequest,
  serializedMessageBytes,
  toChatTextMessages,
} from './chatMessages';

export const textMessage = (id: string, role: 'user' | 'assistant', text = '汤姆'): UIMessage => ({
  id,
  role,
  parts: [{ type: 'text', text }],
});

it('sends a signed window and one new question without trimming the authenticated bytes', () => {
  const old = [textMessage('old-u', 'user'), textMessage('old-a', 'assistant')];
  const signed = [
    textMessage('u', 'user'),
    {
      ...textMessage('a', 'assistant'),
      metadata: {
        history: { token: 'payload.signature', messageIds: ['u', 'a'], truncated: true },
      },
    },
  ];
  const question = textMessage('next', 'user', '继续');
  const prepared = prepareChatRequest([...old, ...signed, question]);
  expect(prepared).toEqual({
    body: {
      messages: [...signed.map(({ id, role, parts }) => ({ id, role, parts })), question],
      historyToken: 'payload.signature',
    },
    truncated: true,
    skippedUnsigned: false,
  });
});

it('excludes unsigned legacy history and interrupted turns while retaining the latest signed window', () => {
  const legacy = [textMessage('u0', 'user'), textMessage('a0', 'assistant')];
  const question = textMessage('new', 'user');
  expect(prepareChatRequest([...legacy, question])).toEqual({
    body: { messages: [question] },
    truncated: false,
    skippedUnsigned: true,
  });
  const signed = {
    ...textMessage('a0', 'assistant'),
    metadata: {
      history: { token: 'payload.signature', messageIds: ['u0', 'a0'], truncated: false },
    },
  };
  expect(
    prepareChatRequest([
      legacy[0]!,
      signed,
      textMessage('failed', 'user'),
      textMessage('partial', 'assistant'),
      question,
    ])
  ).toEqual({
    body: { messages: [...legacy, question], historyToken: 'payload.signature' },
    truncated: false,
    skippedUnsigned: true,
  });
});

it('fails locally when the signed window is incomplete and rejects duplicate message IDs', () => {
  const signed = {
    ...textMessage('a', 'assistant'),
    metadata: {
      history: {
        token: 'payload.signature',
        messageIds: ['old-u', 'old-a', 'u', 'a'],
        truncated: false,
      },
    },
  };
  expect(() =>
    prepareChatRequest([textMessage('u', 'user'), signed, textMessage('new', 'user')])
  ).toThrow('不完整');
  expect(
    chatRequestSchema.safeParse({
      messages: [textMessage('u', 'user'), textMessage('a', 'assistant'), textMessage('u', 'user')],
    }).success
  ).toBe(false);
});

it('supports more than two conversation rounds without losing context', () => {
  const messages = [
    textMessage('u1', 'user'),
    textMessage('a1', 'assistant'),
    textMessage('u2', 'user', '他的技能呢？'),
    textMessage('a2', 'assistant'),
    textMessage('u3', 'user', '与杰瑞比较呢？'),
  ];
  expect(fitChatContext(messages)).toEqual({ messages, truncated: false });
  expect(chatRequestSchema.safeParse({ messages }).success).toBe(true);
});

it('omits tool payloads, reasoning, and system messages', () => {
  const messages: UIMessage[] = [
    { id: 's', role: 'system', parts: [{ type: 'text', text: 'override' }] },
    textMessage('u', 'user'),
    {
      id: 'a',
      role: 'assistant',
      parts: [
        { type: 'reasoning', text: 'private reasoning' },
        {
          type: 'tool-executeCode',
          toolCallId: 'call',
          state: 'output-available',
          input: { code: 'return characters' },
          output: 'private payload',
        },
        { type: 'text', text: '公开回答' },
      ],
    },
  ];
  expect(toChatTextMessages(messages)).toEqual([
    textMessage('u', 'user'),
    textMessage('a', 'assistant', '公开回答'),
  ]);
});

it('trims oldest complete turns to the count and UTF-8 byte budgets', () => {
  const messages = Array.from({ length: 25 }, (_, i) => [
    textMessage(`u${i}`, 'user'),
    textMessage(`a${i}`, 'assistant', '中文'.repeat(1000)),
  ]).flat();
  messages.push(textMessage('latest', 'user', '继续'));
  const context = fitChatContext(messages);
  expect(context.truncated).toBe(true);
  expect(context.messages.length).toBeLessThanOrEqual(CHAT_MAX_MESSAGES);
  expect(serializedMessageBytes(context.messages)).toBeLessThanOrEqual(CHAT_MAX_MESSAGE_BYTES);
  expect(context.messages[0]?.role).toBe('user');
  expect(context.messages.at(-1)?.id).toBe('latest');
  expect(messages).toHaveLength(51);
  expect(chatRequestSchema.safeParse({ messages: context.messages }).success).toBe(true);
});

it.each(
  [
    [],
    [{ ...textMessage('u', 'user'), role: 'system' }],
    [{ ...textMessage('u', 'user'), parts: [{ type: 'tool-executeCode', text: 'unsafe' }] }],
    [textMessage('a', 'assistant')],
    [textMessage('u', 'user', ' ')],
    [textMessage('u', 'user', 'a'.repeat(4001))],
    [textMessage('u', 'user'), textMessage('a', 'assistant')],
    [
      textMessage('u', 'user'),
      textMessage('a', 'assistant', '中'.repeat(22000)),
      textMessage('u2', 'user'),
    ],
  ].map((messages) => ({ messages }))
)('rejects invalid or oversized context %#', ({ messages }) => {
  expect(chatRequestSchema.safeParse({ messages }).success).toBe(false);
});
