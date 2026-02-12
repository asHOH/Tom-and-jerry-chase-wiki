'use client';

import { useEffect } from 'react';
import { subscribe } from 'valtio';

import { entitySnapshotSchema } from '@/lib/validation/schemas';
import { characters, factions } from '@/data';

export function usePersistentGameStore() {
  return;
  useEffect(() => {
    try {
      const charStr = localStorage.getItem('characters');
      if (charStr) {
        const parsed = entitySnapshotSchema.safeParse(JSON.parse(charStr));
        if (parsed.success && parsed.data && !Array.isArray(parsed.data)) {
          Object.assign(characters, parsed.data);
        }
      }
    } catch {}

    try {
      const factionStr = localStorage.getItem('factions');
      if (factionStr) {
        const parsed = entitySnapshotSchema.safeParse(JSON.parse(factionStr));
        if (parsed.success && parsed.data && !Array.isArray(parsed.data)) {
          Object.assign(factions, parsed.data);
        }
      }
    } catch {}

    const unsubChars = subscribe(characters, () => {
      try {
        localStorage.setItem('characters', JSON.stringify(characters));
      } catch {}
    });
    const unsubFactions = subscribe(factions, () => {
      try {
        localStorage.setItem('factions', JSON.stringify(factions));
      } catch {}
    });
    return () => {
      unsubChars();
      unsubFactions();
    };
  }, []);
}
