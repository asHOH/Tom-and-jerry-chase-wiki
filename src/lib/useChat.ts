import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';

// Type definition for a message part, consistent with the API
type Part = {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
};

// Type definition for a message, consistent with the API
export type Message = {
  role: 'user' | 'model';
  parts: Part[];
};

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

// The fetcher function for useSWR that handles the API call
async function sendRequest(key: string) {
  const [, messagesJson] = key.split('|');
  if (!messagesJson) return null;

  const messages = JSON.parse(messagesJson);

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * A hook for managing a single chat request with the Gemini API.
 *
 * @param message The message to send to the chat API.
 * @param debounceMs The debounce delay in milliseconds for sending messages.
 * @returns An object with the current response text, the loading state, and any error that occurred.
 */
export function useChat(message?: string, debounceMs = 500) {
  const [debouncedMessage, setDebouncedMessage] = useState<string | undefined>(message);

  // Debounce the message updates
  const debouncedSetMessage = useMemo(() => {
    return debounce(setDebouncedMessage, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    debouncedSetMessage(message);
  }, [message, debouncedSetMessage]);

  // Create SWR key with only the current message (single round request)
  const swrKey = useMemo(() => {
    if (!debouncedMessage?.trim() || !process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL) return null;

    const singleMessage: Message = { role: 'user', parts: [{ text: debouncedMessage }] };
    return `chat|${JSON.stringify([singleMessage])}`;
  }, [debouncedMessage]);

  const {
    data: responseData,
    isLoading,
    error,
  } = useSWR(swrKey, sendRequest, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 0,
  });

  // Extract the response text
  const responseText = responseData?.text || '';

  return process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL
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
