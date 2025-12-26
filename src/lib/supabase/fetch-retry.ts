const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const TIMEOUT_MS = 10000;

export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Use AbortSignal.any to merge user signal and timeout signal
    const signal = init?.signal
      ? AbortSignal.any([init.signal, controller.signal])
      : controller.signal;

    try {
      const response = await fetch(input, {
        ...init,
        signal,
      });

      return response;
    } catch (error: unknown) {
      lastError = error;

      // If the user aborted, do not retry
      if (init?.signal?.aborted) {
        throw error;
      }

      const err = error as Error & { cause?: { code?: string; name?: string } };
      const isTimeout = err.name === 'AbortError' || err.cause?.name === 'ConnectTimeoutError';
      const isNetworkError =
        err.message?.includes('fetch failed') || err.cause?.code === 'ECONNREFUSED';

      if (attempt < MAX_RETRIES - 1 && (isTimeout || isNetworkError)) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[Supabase] Fetch failed (attempt ${attempt + 1}), retrying in ${delay}ms...`,
          err.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}
