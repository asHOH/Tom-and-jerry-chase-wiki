import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { SWRConfig, type State } from 'swr';

import { useClearArticleClientCache } from './useClearArticleClientCache';

it('clears persisted article/history/preview and queue values without discarding unrelated data', async () => {
  const affected = [
    '/api/articles/a/history',
    '/api/articles/a/info',
    '/api/articles/preview?token=t',
    '/api/articles/pending',
    '/api/moderation/pending',
  ];
  const unrelated = ['/api/articles/b/history', '/api/categories', '/api/auth/me'];
  const cache = new Map<string, State>(
    [...affected, ...unrelated].map((key) => [key, { data: 'old', _k: key }])
  );
  const { result } = renderHook(() => useClearArticleClientCache(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
    ),
  });
  await act(async () => {
    expect(await result.current('a')).toBeNull();
  });
  // UserProvider serializes this map on pagehide; stale data must already be absent.
  const restored = new Map<string, State>(JSON.parse(JSON.stringify([...cache])));
  for (const key of affected) expect(restored.get(key)?.data).toBeUndefined();
  for (const key of unrelated) expect(restored.get(key)?.data).toBe('old');
});
