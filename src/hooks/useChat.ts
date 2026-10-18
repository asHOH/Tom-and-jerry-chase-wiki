'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat as useAIChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { getChatHistoryKey, loadChatHistory, saveChatHistory } from '@/lib/ai/chatHistory';
import { CHAT_MAX_QUESTION_LENGTH, prepareChatRequest } from '@/lib/ai/chatMessages';
import { storage } from '@/lib/localStorage';

const STORAGE_NOTICE = '无法保存本地对话记录，本次对话仅在当前页面保留。';

export function useChat(userId: string, onUnauthorized: () => void) {
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [contextTruncated, setContextTruncated] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestActive = useRef(false);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ messages }) => {
          const request = prepareChatRequest(messages);
          setContextTruncated(request.truncated);
          if (request.skippedUnsigned) setNotice('此前未完成的回答或旧对话未加入本次上下文。');
          return { body: request.body };
        },
        fetch: async (input, init) => {
          const response = await fetch(input, { ...init, cache: 'no-store' });
          if (response.status === 401) {
            onUnauthorized();
            throw new Error('登录已过期，请重新登录。');
          }
          if (!response.ok) {
            throw new Error(
              response.status === 429
                ? '提问太频繁，请稍后重试。'
                : response.status === 503
                  ? 'AI 助手暂时不可用，请稍后重试。'
                  : response.status === 409
                    ? '对话记录校验失败或已过期，请清空对话后重试。'
                    : '回答失败，请稍后重试。'
            );
          }
          return response;
        },
      }),
    [onUnauthorized]
  );
  const chat = useAIChat({ transport });
  const { messages, setMessages, stop, clearError, sendMessage, regenerate, status } = chat;
  const latestMessages = useRef(messages);
  latestMessages.current = messages;
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const restored = loadChatHistory(userId);
    latestMessages.current = restored.messages;
    setMessages(restored.messages);
    setNotice(restored.notice);
    setReady(true);
    const flush = () => saveChatHistory(userId, latestMessages.current);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
      void stop();
    };
  }, [setMessages, stop, userId]);

  useEffect(() => {
    if (!ready) return;
    const save = () => {
      if (!saveChatHistory(userId, messages)) setNotice(STORAGE_NOTICE);
    };
    // Avoid serializing the entire transcript on each streamed token.
    if (!isLoading) {
      save();
      return;
    }
    const timer = window.setTimeout(save, 300);
    return () => window.clearTimeout(timer);
  }, [isLoading, messages, ready, userId]);

  const runRequest = useCallback(
    async (question?: string) => {
      if (!ready || isLoading || requestActive.current) return false;
      const text = question?.trim();
      if (question !== undefined && (!text || text.length > CHAT_MAX_QUESTION_LENGTH)) return false;
      requestActive.current = true;
      setStopped(false);
      setActionError(null);
      clearError();
      try {
        if (text !== undefined) {
          await sendMessage({ text });
        } else {
          await regenerate();
        }
        return true;
      } catch {
        setActionError('回答失败，请稍后重试。');
        return false;
      } finally {
        requestActive.current = false;
      }
    },
    [clearError, isLoading, ready, regenerate, sendMessage]
  );

  const clear = useCallback(() => {
    // Clearing is disabled while a response is in flight, avoiding a late stream restoring it.
    if (isLoading || requestActive.current) return;
    setMessages([]);
    latestMessages.current = [];
    clearError();
    setActionError(null);
    setStopped(false);
    setContextTruncated(false);
    setNotice(storage.removeItem(getChatHistoryKey(userId)) ? null : STORAGE_NOTICE);
  }, [clearError, isLoading, setMessages, userId]);

  return {
    messages,
    ready,
    notice,
    contextTruncated,
    isLoading,
    stopped,
    error: chat.error?.message ?? actionError,
    send: (question: string) => runRequest(question),
    retry: () => runRequest(),
    stop: () => {
      setStopped(true);
      void stop();
    },
    clear,
  };
}
