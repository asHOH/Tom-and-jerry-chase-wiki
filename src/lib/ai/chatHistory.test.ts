import type { UIMessage } from 'ai';

import { storage } from '@/lib/localStorage';

import { getChatHistoryKey, loadChatHistory, saveChatHistory } from './chatHistory';

const messages: UIMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    parts: [{ type: 'text', text: '汤姆' }],
  },
  {
    id: 'answer-1',
    role: 'assistant',
    parts: [
      { type: 'text', text: '未完成的回答' },
      { type: 'reasoning', text: 'private' },
      {
        type: 'tool-executeCode',
        toolCallId: 'call',
        state: 'input-available',
        input: { code: 'return characters' },
      },
    ],
  },
];

beforeEach(() => localStorage.clear());

it('restores partial text across visits and isolates accounts', () => {
  expect(saveChatHistory('account-a', messages)).toBe(true);
  expect(loadChatHistory('account-a').messages).toEqual([
    messages[0],
    { id: 'answer-1', role: 'assistant', parts: [{ type: 'text', text: '未完成的回答' }] },
  ]);
  expect(loadChatHistory('account-b').messages).toEqual([]);
  expect(storage.getItem(getChatHistoryKey('account-a'))).not.toMatch(/private|executeCode/);
});

it('recovers corrupted or incompatible local history', () => {
  storage.setItem(getChatHistoryKey('account-a'), '{invalid');
  expect(loadChatHistory('account-a')).toMatchObject({
    messages: [],
    notice: expect.stringContaining('损坏'),
  });
  expect(storage.getItem(getChatHistoryKey('account-a'))).toBeNull();
  storage.setJson(getChatHistoryKey('account-a'), { version: 3, messages });
  expect(loadChatHistory('account-a').messages).toEqual([]);
});

it('preserves only the history proof alongside visible text', () => {
  const metadata = {
    history: { token: 'payload.signature', messageIds: ['user-1', 'answer-1'], truncated: false },
  };
  saveChatHistory('account-a', [messages[0]!, { ...messages[1]!, metadata }]);
  const restored = loadChatHistory('account-a');
  expect(restored.messages[1]?.metadata).toEqual(metadata);
  expect(restored.notice).toBeNull();
  expect(storage.getItem(getChatHistoryKey('account-a'))).not.toMatch(/private|executeCode/);
});

it('keeps old unsigned conversations visible with a migration notice', () => {
  storage.setJson(getChatHistoryKey('account-a'), { version: 1, messages: [messages[0]] });
  expect(loadChatHistory('account-a')).toEqual({
    messages: [messages[0]],
    notice: expect.stringContaining('新的上下文'),
  });
});

it('reports storage write failure and safely tolerates inaccessible reads', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(saveChatHistory('account-a', messages)).toBe(false);
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(loadChatHistory('account-a').messages).toEqual([]);
});
