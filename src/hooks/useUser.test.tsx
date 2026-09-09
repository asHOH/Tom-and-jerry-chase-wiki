import { act, renderHook } from '@testing-library/react';
import { unstable_serialize, useSWRConfig } from 'swr';

import { storage, StorageKey } from '@/lib/localStorage';

import { UserProvider } from './useUser';

jest.mock('@/lib/supabase/config', () => ({ hasSupabasePublicConfig: () => true }));
jest.mock('@/lib/supabase/browserClient', () => ({
  getOptionalSupabaseBrowserClient: () => undefined,
}));

it('keeps moderation pages out of persisted SWR data without dropping other caches', async () => {
  const actionKey = unstable_serialize([
    'game-data-actions-admin',
    'pending',
    null,
    null,
    1,
    'session',
  ]);
  storage.setJson(StorageKey.SwrCache, [
    [actionKey, { data: 'old moderation page' }],
    ['ordinary-cache', { data: 'retained' }],
  ]);
  const { result } = renderHook(() => useSWRConfig(), { wrapper: UserProvider });
  expect(result.current.cache.get(actionKey)).toBeUndefined();
  expect(result.current.cache.get('ordinary-cache')?.data).toBe('retained');
  await act(async () => {
    await result.current.mutate(
      ['game-data-actions-admin', 'pending', null, null, 1, 'session'],
      'new moderation page',
      { revalidate: false }
    );
  });
  expect(result.current.cache.get(actionKey)?.data).toBe('new moderation page');
  window.dispatchEvent(new Event('pagehide'));
  const saved = storage.getJson<Array<[string, unknown]>>(StorageKey.SwrCache);
  expect(saved?.map(([key]) => key)).toEqual(['ordinary-cache']);
  storage.removeItem(StorageKey.SwrCache);
});
