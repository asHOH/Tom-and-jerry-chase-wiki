'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat as useAIChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { env } from '@/env';

// Debounce utility to delay function execution
function debounce<T extends (...args: never[]) => void>(func: T, waitFor: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  }) as T;
}

/**
 * A hook for managing AI chat requests.
 *
 * @param message The message to send to the chat API.
 * @param debounceMs The debounce delay in milliseconds for sending messages.
 * @returns An object with the current response text, the loading state, and any error that occurred.
 */
export function useChat(message?: string, debounceMs = 500) {
  const [debouncedMessage, setDebouncedMessage] = useState<string | undefined>(message);
  const [responseText, setResponseText] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Debounce the message updates
  const debouncedSetMessage = useMemo(() => {
    return debounce(setDebouncedMessage, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    debouncedSetMessage(message);
  }, [message, debouncedSetMessage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const featureEnabled = env.NEXT_PUBLIC_AI_CHAT_MODEL;

  const {
    sendMessage,
    setMessages,
    error: aiError,
    status,
  } = useAIChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onFinish: useCallback(({ message }) => {
      if (!mountedRef.current) return;
      const text = message.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
      if (text) {
        setResponseText(text);
      }
    }, []),
  });

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
  }, [debouncedMessage, featureEnabled, setMessages, sendMessage]);

  const isLoading = status === 'submitted' || status === 'streaming';

  return featureEnabled
    ? {
        responseText,
        isLoading,
        error,
      }
    : {
        responseText: null,
        isLoading: false,
        error: null,
      };
}
