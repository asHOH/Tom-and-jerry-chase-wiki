import { clearActiveEditSession, installActiveEditSession } from '@/lib/edit/activeEditSession';
import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import { createEditSession, type EditSession } from '@/lib/edit/editSession';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getEditModeActionsStorageKey, storage } from '@/lib/localStorage';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
  traits,
} from '@/data/static';

const baseline = {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
  traits,
} as PublishedGameDataByType;

export function installTestEditSession(): EditSession {
  const session = createEditSession(baseline, 'v1:test');
  installActiveEditSession(session);
  return session;
}

export function clearTestEditSession(session: EditSession): void {
  session.dispose();
  clearActiveEditSession(session);
}

export const getTestEditHistoryKey = getEditModeActionsStorageKey;

export function readTestEditHistory(storageKey: string): ActionHistoryEntry[] {
  return storage.getJson<ActionHistoryEntry[]>(storageKey) ?? [];
}

export function writeTestEditHistory(storageKey: string, history: ActionHistoryEntry[]): boolean {
  return storage.setJson(storageKey, history);
}
