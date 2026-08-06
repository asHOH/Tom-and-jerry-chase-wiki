'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat as useAIChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { env } from '@/env';

/**
 * A hook for managing AI chat requests.
 *
 * @param message The message to send to the chat API.
 * @param debounceMs The debounce delay in milliseconds for sending messages.
 * @returns An object with the current response text, the loading state, and any error that occurred.
 */
export function useChat(message?: string, debounceMs = 500) {
  const [debouncedMessage, setDebouncedMessage] = useState<string | undefined>();
  const [responseText, setResponseText] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const featureEnabled = env.NEXT_PUBLIC_AI_CHAT_MODEL;
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

  const {
    sendMessage,
    setMessages,
    messages,
    error: aiError,
    status,
    stop,
  } = useAIChat({
    transport,
    onFinish: useCallback(({ message, isAbort }) => {
      if (!mountedRef.current || isAbort) return;
      const text = message.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
      if (text) {
        setResponseText(text);
      }
    }, []),
  });

  const stopChat = useCallback(() => {
    pendingRef.current = null;
    stop();
  }, [stop]);

  // Stop the current paid request as soon as the input changes. Waiting for the
  // debounce here would allow an obsolete response to keep generating tokens.
  useEffect(() => {
    stopChat();
    setResponseText('');
    setError(null);
    setMessages([]);

    if (!message?.trim() || !featureEnabled) {
      setDebouncedMessage(undefined);
      return;
    }

    const timeout = setTimeout(() => setDebouncedMessage(message), debounceMs);
    return () => clearTimeout(timeout);
  }, [debounceMs, featureEnabled, message, setMessages, stopChat]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopChat();
    };
  }, [stopChat]);

  // Keep the displayed answer in sync with the assistant message while it streams.
  useEffect(() => {
    if (!mountedRef.current) return;

    const latestAssistantMessage = [...messages]
      .reverse()
      .find((chatMessage) => chatMessage.role === 'assistant');
    const text = latestAssistantMessage?.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

    setResponseText(text ?? '');
  }, [messages]);

  // Map AI SDK error to local error state
  useEffect(() => {
    if (aiError && mountedRef.current) {
      setError(new Error(aiError.message));
    } else if (!aiError) {
      setError(null);
    }
  }, [aiError]);

  // When debounced message changes, start a fresh conversation
  useEffect(() => {
    if (!debouncedMessage?.trim() || !featureEnabled) {
      stopChat();
      setResponseText('');
      setError(null);
      setMessages([]);
      return;
    }

    setResponseText('');
    setError(null);

    // Store pending message and trigger via ref pattern
    pendingRef.current = debouncedMessage;

    // Clear and send in the same tick
    setMessages([]);

    // Use queueMicrotask to ensure setMessages is committed before sendMessage
    queueMicrotask(() => {
      const msg = pendingRef.current;
      if (msg && mountedRef.current) {
        pendingRef.current = null;
        sendMessage({ text: msg });
      }
    });
  }, [debouncedMessage, featureEnabled, setMessages, sendMessage, stopChat]);

  const isLoading = status === 'submitted' || status === 'streaming';

  return featureEnabled
    ? {
        responseText,
        isLoading,
        error,
        stop: stopChat,
      }
    : {
        responseText: null,
        isLoading: false,
        error: null,
        stop: stopChat,
      };
}
