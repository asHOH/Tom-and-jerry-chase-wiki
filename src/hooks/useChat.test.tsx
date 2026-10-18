import { ReadableStream } from 'node:stream/web';
import { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { loadChatHistory, saveChatHistory } from '@/lib/ai/chatHistory';

import { useChat } from './useChat';

jest.mock('ai', () => {
  Object.assign(globalThis, jest.requireActual('node:stream/web'));
  return jest.requireActual('ai');
});
const mockFetch = jest.fn();
const onUnauthorized = jest.fn();
const originalFetch = global.fetch;

const event = (value: unknown) => new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`);
function answerResponse(
  answer: string,
  signal?: AbortSignal | null,
  hold = false,
  historyIds: string[] = ['u']
) {
  const responseId = `answer-${Math.random()}`;
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of [
        { type: 'start', messageId: responseId },
        { type: 'text-start', id: 'text' },
        { type: 'text-delta', id: 'text', delta: answer },
      ])
        controller.enqueue(event(chunk));
      if (hold) {
        signal?.addEventListener('abort', () =>
          controller.error(new DOMException('Aborted', 'AbortError'))
        );
      } else {
        controller.enqueue(event({ type: 'text-end', id: 'text' }));
        controller.enqueue(
          event({
            type: 'finish',
            finishReason: 'stop',
            messageMetadata: {
              history: {
                token: 'payload.signature',
                messageIds: [...historyIds, responseId],
                truncated: false,
              },
            },
          })
        );
        controller.close();
      }
    },
  });
  return { ok: true, status: 200, body, headers: new Headers() } as unknown as Response;
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = mockFetch;
  mockFetch.mockReset().mockImplementation(async (_input, init) =>
    answerResponse(
      '回答',
      init?.signal,
      false,
      JSON.parse(init.body).messages.map((message: { id: string }) => message.id)
    )
  );
});
afterAll(() => {
  global.fetch = originalFetch;
});

it('restores without requests, preserves three rounds, and clears saved history', async () => {
  saveChatHistory('account-a', [
    { id: 'u0', role: 'user', parts: [{ type: 'text', text: '汤姆' }] },
    {
      id: 'a0',
      role: 'assistant',
      parts: [{ type: 'text', text: '介绍' }],
      metadata: {
        history: { token: 'payload.signature', messageIds: ['u0', 'a0'], truncated: false },
      },
    },
  ]);
  const { result } = renderHook(() => useChat('account-a', onUnauthorized), {
    wrapper: StrictMode,
  });
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect(result.current.messages).toHaveLength(2);
  expect(mockFetch).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.send('技能呢？');
  });
  await act(async () => {
    await result.current.send('与杰瑞比较呢？');
  });
  expect(result.current.messages).toHaveLength(6);
  const payload = JSON.parse(mockFetch.mock.calls[1]?.[1].body);
  expect(payload.messages).toHaveLength(5);
  expect(payload.messages[0].parts[0].text).toBe('汤姆');
  expect(payload.historyToken).toBe('payload.signature');
  expect(loadChatHistory('account-a').messages.at(-1)?.metadata).toEqual({
    history: {
      token: 'payload.signature',
      messageIds: result.current.messages.map((message) => message.id),
      truncated: false,
    },
  });
  expect(loadChatHistory('account-a').messages).toHaveLength(6);
  act(() => result.current.clear());
  expect(result.current.messages).toHaveLength(0);
  expect(loadChatHistory('account-a').messages).toEqual([]);
});

it('stops a streaming request, retains partial text, and retries the same question', async () => {
  mockFetch.mockImplementationOnce(async (_input, init) =>
    answerResponse('部分回答', init?.signal, true)
  );
  const { result } = renderHook(() => useChat('account-a', onUnauthorized));
  let pending: Promise<boolean>;
  act(() => {
    pending = result.current.send('汤姆');
  });
  await waitFor(() =>
    expect(result.current.messages.at(-1)?.parts).toContainEqual(
      expect.objectContaining({ type: 'text', text: '部分回答' })
    )
  );
  await act(async () => {
    result.current.stop();
    await pending;
  });
  expect(mockFetch.mock.calls[0]?.[1].signal.aborted).toBe(true);
  expect(result.current.stopped).toBe(true);
  expect(loadChatHistory('account-a').messages.at(-1)?.parts[0]).toMatchObject({
    text: '部分回答',
  });
  await act(async () => {
    await result.current.retry();
  });
  expect(JSON.parse(mockFetch.mock.calls[1]?.[1].body).messages).toHaveLength(1);
  expect(result.current.messages).toHaveLength(2);
  expect(JSON.parse(mockFetch.mock.calls[1]?.[1].body).historyToken).toBeUndefined();
});

it('uses persisted signatures after remount and never sends partial replies as history', async () => {
  const first = renderHook(() => useChat('account-a', onUnauthorized));
  await act(async () => {
    await first.result.current.send('汤姆');
  });
  first.unmount();
  const second = renderHook(() => useChat('account-a', onUnauthorized));
  mockFetch.mockImplementationOnce(async (_input, init) =>
    answerResponse('部分', init?.signal, true)
  );
  let pending: Promise<boolean>;
  act(() => {
    pending = second.result.current.send('未完成的问题');
  });
  await waitFor(() =>
    expect(second.result.current.messages.at(-1)?.parts[0]).toMatchObject({ text: '部分' })
  );
  await act(async () => {
    second.result.current.stop();
    await pending;
  });
  await act(async () => {
    await second.result.current.send('新问题');
  });
  const payload = JSON.parse(mockFetch.mock.calls[2]?.[1].body);
  expect(payload.historyToken).toBe('payload.signature');
  expect(
    payload.messages.map((message: { parts: { text: string }[] }) => message.parts[0]?.text)
  ).toEqual(['汤姆', '回答', '新问题']);
  expect(second.result.current.notice).toContain('未完成');
  await act(async () => {
    await second.result.current.send('再继续');
  });
  const continued = JSON.parse(mockFetch.mock.calls[3]?.[1].body);
  expect(
    continued.messages.map((message: { parts: { text: string }[] }) => message.parts[0]?.text)
  ).toEqual(['汤姆', '回答', '新问题', '回答', '再继续']);
});

it('shows an actionable verification failure without silently replaying a new conversation', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });
  const { result } = renderHook(() => useChat('account-a', onUnauthorized));
  await act(async () => {
    await result.current.send('汤姆');
  });
  expect(result.current.error).toContain('清空对话');
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(onUnauthorized).not.toHaveBeenCalled();
});

it('aborts on unmount and restores only the next account’s history', async () => {
  mockFetch.mockImplementationOnce(async (_input, init) =>
    answerResponse('账户 A 的回答', init?.signal, true)
  );
  const first = renderHook(() => useChat('account-a', onUnauthorized));
  let pending: Promise<boolean>;
  act(() => {
    pending = first.result.current.send('账户 A 的问题');
  });
  await waitFor(() => expect(first.result.current.isLoading).toBe(true));
  await act(async () => {
    first.unmount();
    await pending;
  });
  expect(mockFetch.mock.calls[0]?.[1].signal.aborted).toBe(true);
  const second = renderHook(() => useChat('account-b', onUnauthorized));
  expect(second.result.current.messages).toEqual([]);
  expect(loadChatHistory('account-a').messages[0]?.parts[0]).toMatchObject({
    text: '账户 A 的问题',
  });
});

it('blocks duplicate submissions and never automatically replays expired requests', async () => {
  mockFetch.mockImplementationOnce(async (_input, init) =>
    answerResponse('部分', init?.signal, true)
  );
  const { result } = renderHook(() => useChat('account-a', onUnauthorized));
  let pending: Promise<boolean>;
  act(() => {
    pending = result.current.send('汤姆');
    void result.current.send('重复');
  });
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  await act(async () => {
    result.current.stop();
    await pending;
  });
  mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
  await act(async () => {
    await result.current.retry();
  });
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

it('keeps conversation usable in memory when localStorage fails', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  const { result } = renderHook(() => useChat('account-a', onUnauthorized));
  expect(result.current.notice).toContain('仅在当前页面保留');
  await act(async () => {
    await result.current.send('汤姆');
  });
  expect(result.current.messages).toHaveLength(2);
});
