'use client';

import { useEffect } from 'react';
import { subscribe } from 'valtio';

import { characters, factions } from '@/data';

export function usePersistentGameStore() {
  return;
  useEffect(() => {
    try {
      const charStr = localStorage.getItem('characters');
      if (charStr) {
        const parsed = JSON.parse(charStr);
        Object.assign(characters, parsed);
      }
    } catch {}

    try {
      const factionStr = localStorage.getItem('factions');
      if (factionStr) {
        const parsed = JSON.parse(factionStr);
        Object.assign(factions, parsed);
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
