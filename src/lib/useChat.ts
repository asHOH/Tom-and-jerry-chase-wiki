import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { cards, characters, specialSkills, items, entities, buffs, itemGroups } from '@/data';
import { snapshot } from 'valtio';

// Type definition for a message part, consistent with the API
type Part = {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: {
      name: string;
      content: unknown;
    };
  };
};

// Type definition for a message, consistent with the API
export type Message = {
  role: 'user' | 'model';
  parts: Part[];
};

// Type for function calls returned by the API
type FunctionCall = {
  name: string;
  args: Record<string, unknown>;
};

// Type for API response
type ApiResponse =
  | {
      requiresAction: true;
      functionCalls: FunctionCall[];
    }
  | {
      text: string;
      candidates?: unknown[];
    }
  | {
      error: string;
      details?: string;
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

// Client-side code execution implementation
// Executes JavaScript code with game data objects in scope
async function executeCode({ code }: { code: string }) {
  try {
    // Create a function that executes the code with all game data in scope
    // Using Function constructor to safely execute code in a controlled context
    const executorFunction = new Function(
      'characters',
      'cards',
      'specialSkills',
      'items',
      'entities',
      'buffs',
      'itemGroups',
      code
    );

    // Execute the code and return the result
    const result = executorFunction(
      snapshot(characters),
      snapshot(cards),
      snapshot(specialSkills),
      snapshot(items),
      snapshot(entities),
      snapshot(buffs),
      snapshot(itemGroups)
    );

    return result;
  } catch (error) {
    // Return error information if code execution fails
    return {
      error: 'Code execution failed',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * A hook for managing multi-round chat requests with client-side tool calling.
 *
 * @param message The message to send to the chat API.
 * @param debounceMs The debounce delay in milliseconds for sending messages.
 * @returns An object with the current response text, the loading state, and any error that occurred.
 */
export function useChat(message?: string, debounceMs = 500) {
  const [debouncedMessage, setDebouncedMessage] = useState<string | undefined>(message);
  const [responseText, setResponseText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<number>(0);

  // Debounce the message updates
  const debouncedSetMessage = useMemo(() => {
    return debounce(setDebouncedMessage, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    debouncedSetMessage(message);
  }, [message, debouncedSetMessage]);

  // Execute tool calls and return updated messages
  const executeFunctionCalls = useCallback(
    async (functionCalls: FunctionCall[], currentMessages: Message[]): Promise<Message[]> => {
      const updatedMessages = [...currentMessages];

      // Add model's function call to history
      updatedMessages.push({
        role: 'model',
        parts: functionCalls.map((fc) => ({
          functionCall: {
            name: fc.name,
            args: fc.args,
          },
        })),
      });

      // Execute each function call and collect results
      const functionResponses: Part[] = [];
      for (const functionCall of functionCalls) {
        if (functionCall.name === 'executeCode') {
          const toolResult = await executeCode(functionCall.args as { code: string });
          functionResponses.push({
            functionResponse: {
              name: 'executeCode',
              response: { name: 'executeCode', content: toolResult },
            },
          });
        }
      }

      // Add function responses to history
      updatedMessages.push({
        role: 'user',
        parts: functionResponses,
      });

      return updatedMessages;
    },
    []
  );

  // Main request function with multi-round support
  const sendRequest = useCallback(
    async (requestId: number, initialMessage: string) => {
      if (!process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL) {
        return;
      }

      const MAX_ROUNDS = 5; // Safety limit for multi-round requests
      let messages: Message[] = [{ role: 'user', parts: [{ text: initialMessage }] }];

      for (let round = 0; round < MAX_ROUNDS; round++) {
        // Check if this request is still current
        if (currentRequestIdRef.current !== requestId) {
          console.log('Request cancelled, newer request in progress');
          return;
        }

        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
            signal: abortControllerRef.current!.signal,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${errorText}`);
          }

          const data: ApiResponse = await response.json();

          // Check for errors
          if ('error' in data) {
            throw new Error(data.details || data.error);
          }

          // Check if function calls are required
          if ('requiresAction' in data && data.requiresAction) {
            console.log(`Round ${round + 1}: Function calls required`, data.functionCalls);
            // Execute function calls and update messages
            messages = await executeFunctionCalls(data.functionCalls, messages);
            // Continue loop for next round
            continue;
          }

          // Final text response received
          if ('text' in data) {
            // Only update if this request is still current
            if (currentRequestIdRef.current === requestId) {
              setResponseText(data.text);
              setIsLoading(false);
              setError(null);
            }
            return;
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('Request aborted');
            return;
          }
          // Only update error if this request is still current
          if (currentRequestIdRef.current === requestId) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
          }
          return;
        }
      }

      // If we've reached here, max rounds exceeded
      if (currentRequestIdRef.current === requestId) {
        setError(new Error('Maximum number of conversation rounds reached'));
        setIsLoading(false);
      }
    },
    [executeFunctionCalls]
  );

  // Effect to trigger request when debounced message changes
  useEffect(() => {
    if (!debouncedMessage?.trim() || !process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL) {
      setResponseText('');
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Increment request ID
    const requestId = ++currentRequestIdRef.current;

    // Reset state
    setResponseText('');
    setIsLoading(true);
    setError(null);

    // Start request
    sendRequest(requestId, debouncedMessage);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedMessage, sendRequest]);

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
