'use client';

import { useEffect, useRef, useState } from 'react';

import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';
import type {
  PublishedGameDataByType,
  PublishedGameDataSnapshot,
} from '@/lib/gameData/published/types';
import * as baseline from '@/data/static';

type SearchSnapshot = Pick<PublishedGameDataSnapshot, 'revision' | 'data'>;

const SNAPSHOT_URL = '/api/game-data-actions/edit-baseline/';
// Only the public GET snapshot belongs here; keep it separate from expiring API caches.
const CACHE_NAME = 'published-search-v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSearchSnapshot(value: unknown): value is SearchSnapshot {
  if (!isRecord(value) || typeof value.revision !== 'string' || !value.revision.startsWith('v1:'))
    return false;
  const data = value.data;
  return (
    isRecord(data) &&
    PUBLISHABLE_ENTITY_TYPES.every((type) => {
      const domain = data[type];
      return (
        isRecord(domain) &&
        ((type !== 'specialSkills' && type !== 'achievements') ||
          (isRecord(domain.cat) && isRecord(domain.mouse)))
      );
    })
  );
}

export function useSearchGameData(enabled: boolean): PublishedGameDataByType {
  const [snapshot, setSnapshot] = useState<SearchSnapshot | null>(null);
  const retained = useRef<{ revision: string; etag: string | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let refreshing = false;

    const install = (next: SearchSnapshot, etag: string | null) => {
      if (!controller.signal.aborted) {
        const previous = retained.current;
        retained.current = { revision: next.revision, etag };
        if (previous?.revision !== next.revision) setSnapshot(next);
      }
    };

    const restore = async () => {
      if (retained.current || typeof caches === 'undefined') return;
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(SNAPSHOT_URL);
        const cached: unknown = response ? await response.json() : null;
        if (isSearchSnapshot(cached) && !retained.current) {
          install(cached, response!.headers.get('ETag'));
        }
      } catch (error) {
        console.warn('Unable to restore offline search data:', error);
      }
    };

    const refresh = async () => {
      if (!navigator.onLine || refreshing) return;
      refreshing = true;
      try {
        const etag = retained.current?.etag;
        const response = await fetch(SNAPSHOT_URL, {
          credentials: 'omit',
          cache: 'no-store',
          signal: controller.signal,
          ...(etag ? { headers: { 'If-None-Match': etag } } : {}),
        });
        if (response.status === 304) return;
        if (!response.ok) return;
        const next: unknown = await response.clone().json();
        if (!isSearchSnapshot(next) || controller.signal.aborted) return;
        install(next, response.headers.get('ETag'));
        if (typeof caches !== 'undefined') {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(SNAPSHOT_URL, response);
          } catch (error) {
            console.warn('Unable to persist offline search data:', error);
          }
        }
      } catch {
        // Offline, aborted, or failed refresh: keep searching the last available local data.
      } finally {
        refreshing = false;
      }
    };

    void restore();
    void refresh();
    window.addEventListener('online', refresh);
    return () => {
      controller.abort();
      window.removeEventListener('online', refresh);
    };
  }, [enabled]);

  return snapshot?.data ?? baseline;
}
