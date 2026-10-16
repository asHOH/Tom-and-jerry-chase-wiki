import type { FactionId } from '@/data/types';

export const FACTION_NAMES = {
  cat: '猫',
  mouse: '鼠',
} as const satisfies Record<FactionId, string>;

export const FACTION_FULL_NAMES = {
  cat: '猫阵营',
  mouse: '鼠阵营',
} as const satisfies Record<FactionId, string>;

export const getFactionLabel = (factionId: string | undefined): '猫' | '鼠' | undefined =>
  factionId === 'cat' || factionId === 'mouse' ? FACTION_NAMES[factionId] : undefined;
