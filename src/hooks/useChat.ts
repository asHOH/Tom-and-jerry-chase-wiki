'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat as useAIChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { snapshot } from 'valtio';

import { historyData } from '@/data/history';
import { buffs, cards, characters, entities, itemGroups, items, specialSkills } from '@/data';
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

// Client-side code execution implementation
// Executes JavaScript code in a sandboxed iframe for security
async function executeCode({ code }: { code: string }): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
      const csp = `default-src 'none'; script-src 'nonce-${nonce}';`;
      // Create a sandboxed iframe for isolated code execution
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src =
        'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta http-equiv="Content-Security-Policy" content="${csp}">
                <script nonce="${nonce}">
                  try {
                    // Receive data from parent
                    var characters = ${JSON.stringify(snapshot(characters))};
                    var cards = ${JSON.stringify(cards)};
                    var specialSkills = ${JSON.stringify(specialSkills)};
                    var items = ${JSON.stringify(items)};
                    var entities = ${JSON.stringify(entities)};
                    var buffs = ${JSON.stringify(buffs)};
                    var itemGroups = ${JSON.stringify(itemGroups)};
                    var historyData = ${JSON.stringify(historyData)};
                    // Execute the user code
                    var result = (function() {
                      ${code}
                    })();

                    // Send result back to parent
                    window.parent.postMessage(result, '*');
                  } catch (error) {
                    // Send error back to parent
                    window.parent.postMessage({
                      error: 'Code execution failed',
                      details: error instanceof Error ? error.message : String(error)
                    }, '*');
                  }
                </script>
              </head>
              <body></body>
            </html>
          `
        );
      iframe.setAttribute('sandbox', 'allow-scripts');
      document.body.appendChild(iframe);

      // Set up message handler to receive result from iframe
      const messageHandler = (event: MessageEvent) => {
        // Verify the message is from our iframe
        if (event.source === iframe.contentWindow) {
          window.removeEventListener('message', messageHandler);
          document.body.removeChild(iframe);
          resolve(event.data);
        }
      };

      window.addEventListener('message', messageHandler);

      // Set timeout to prevent hanging
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({
          error: 'Code execution timeout',
          details: 'Execution exceeded 10 seconds',
        });
      }, 10000);
    } catch (error) {
      // Return error information if setup fails
      resolve({
        error: 'Code execution setup failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * A hook for managing AI chat requests with client-side tool calling.
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

  // Ref to hold addToolResult, avoiding circular dependency in onToolCall
  const addToolResultRef = useRef<
    ((options: { tool: string; toolCallId: string; output: unknown }) => void) | null
  >(null);

  const {
    sendMessage,
    setMessages,
    addToolResult,
    error: aiError,
    status,
  } = useAIChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: useCallback(async ({ toolCall }) => {
      if (toolCall.toolName === 'executeCode' && 'input' in toolCall) {
        const toolInput = toolCall.input as { code: string };
        const result = await executeCode({ code: toolInput.code });
        addToolResultRef.current?.({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: result,
        });
      }
    }, []),
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

  // Wire up addToolResult ref after render
  useEffect(() => {
    addToolResultRef.current = addToolResult;
  }, [addToolResult]);

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
