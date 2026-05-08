'use client';

import { useEffect } from 'react';
import { subscribe } from 'valtio';

import { entitySnapshotSchema } from '@/lib/validation/schemas';
import { characters } from '@/data/store';

export function usePersistentGameStore() {
  useEffect(() => {
    try {
      const charStr = localStorage.getItem('characters');
      if (charStr) {
        const parsed = entitySnapshotSchema.safeParse(JSON.parse(charStr));
        if (parsed.success && parsed.data && !Array.isArray(parsed.data)) {
          Object.assign(characters, parsed.data);
        }
      }
    } catch (error) {
      console.warn('Failed to hydrate persisted character store:', error);
    }

    const unsubChars = subscribe(characters, () => {
      try {
        localStorage.setItem('characters', JSON.stringify(characters));
      } catch (error) {
        console.warn('Failed to persist character store:', error);
      }
    });
    return () => {
      unsubChars();
    };
  }, []);
}
