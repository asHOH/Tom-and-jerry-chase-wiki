import { revalidateTag, unstable_cache } from 'next/cache';

import { CACHE_TAGS, invalidateCache } from './cacheTags';
import { cached, createCached } from './serverCache';

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('does not join a pre-publication read after immediate invalidation', async () => {
  const old = deferred<string>();
  const fresh = deferred<string>();
  const unrelated = deferred<string>();
  const tags = [CACHE_TAGS.article('article-1')];
  const oldRead = cached(['race'], () => old.promise, { tags });
  const unrelatedRead = cached(['unrelated'], () => unrelated.promise, { tags: ['users'] });

  invalidateCache(tags[0]!, 'immediate');
  expect(revalidateTag).toHaveBeenCalledWith(tags[0], { expire: 0 });
  const newRead = cached(['race'], () => fresh.promise, { tags });
  expect(newRead).not.toBe(oldRead);
  expect(cached(['unrelated'], async () => 'wrong', { tags: ['users'] })).toBe(unrelatedRead);

  old.resolve('old body');
  await oldRead;
  // An older read settling must not remove the new acquisition.
  expect(cached(['race'], async () => 'wrong', { tags })).toBe(newRead);
  fresh.resolve('published body');
  unrelated.resolve('unchanged user');
  await expect(newRead).resolves.toBe('published body');
  await unrelatedRead;
  expect(unstable_cache).toHaveBeenCalledTimes(3);
});

it('preserves background deduplication and the max profile for unrelated callers', async () => {
  const pending = deferred<string>();
  const read = cached(['background'], () => pending.promise, { tags: ['users'] });
  invalidateCache('users', 'background');
  expect(revalidateTag).toHaveBeenCalledWith('users', 'max');
  expect(cached(['background'], async () => 'new', { tags: ['users'] })).toBe(read);
  pending.resolve('user');
  await read;
});

it('retries invalidated fills before Next can store them, even without a coalesced acquisition', async () => {
  const old = deferred<string>();
  const source = jest.fn().mockReturnValueOnce(old.promise).mockResolvedValue('published body');
  const read = createCached(['late-fill'], source, { tags: ['article:a'] });
  const pending = read();
  invalidateCache('article:a', 'immediate');
  old.resolve('superseded body');
  await expect(pending).resolves.toBe('published body');
  expect(source).toHaveBeenCalledTimes(2);
});

it('does not retry unrelated or background-invalidated fills', async () => {
  const old = deferred<string>();
  const source = jest.fn(() => old.promise);
  const pending = createCached(['unchanged-fill'], source, { tags: ['users'] })();
  invalidateCache('article:a', 'immediate');
  invalidateCache('users', 'background');
  old.resolve('user');
  await expect(pending).resolves.toBe('user');
  expect(source).toHaveBeenCalledTimes(1);
});
