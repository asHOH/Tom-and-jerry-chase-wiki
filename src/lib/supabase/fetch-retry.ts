const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const TIMEOUT_MS = 10000;

export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Preserve existing signal if possible, but we need to handle our timeout
      // If init.signal aborts, fetch aborts. If our timeout fires, fetch aborts.
      // We can't easily merge signals without 'abort-controller' package or recent Node.js features,
      // but for this specific timeout error fix, controlling the timeout explicitly is key.

      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      lastError = error;

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
    }
  }

  throw lastError;
}
