import { CatPositioningTagName, MousePositioningTagName } from '@/data/types';

// Define display sequences for positioning tags
export const CAT_POSITIONING_TAG_SEQUENCE: CatPositioningTagName[] = [
  '进攻',
  '防守',
  '追击',
  '打架',
  '速通',
  '后期',
  '翻盘',
];

export const MOUSE_POSITIONING_TAG_SEQUENCE: MousePositioningTagName[] = [
  '奶酪',
  '干扰',
  '救援',
  '辅助',
  '破局',
  '砸墙',
  '后期',
];

/**
 * Get the display sequence for a specific tag within its faction
 */
export function getPositioningTagSequence(tagName: string, factionId: 'cat' | 'mouse'): number {
  if (factionId === 'cat') {
    const index = CAT_POSITIONING_TAG_SEQUENCE.indexOf(tagName as CatPositioningTagName);
    return index === -1 ? 999 : index;
  } else {
    const index = MOUSE_POSITIONING_TAG_SEQUENCE.indexOf(tagName as MousePositioningTagName);
    return index === -1 ? 999 : index;
  }
}

/**
 * Sort positioning tags according to their display sequence
 * Main tags are sorted by sequence, then minor tags are sorted by sequence
 */
export function sortPositioningTags<T extends { tagName: string; isMinor: boolean }>(
  tags: T[],
  factionId: 'cat' | 'mouse'
): T[] {
  return tags.sort((a, b) => {
    // Main tags always come before minor tags
    if (a.isMinor !== b.isMinor) {
      return a.isMinor ? 1 : -1;
    }

    // Within the same category (main or minor), sort by sequence
    const aSequence = getPositioningTagSequence(a.tagName, factionId);
    const bSequence = getPositioningTagSequence(b.tagName, factionId);
    return aSequence - bSequence;
  });
}

/**
 * Sort positioning tag names according to their display sequence
 */
export function sortPositioningTagNames(tagNames: string[], factionId: 'cat' | 'mouse'): string[] {
  return tagNames.sort((a, b) => {
    const aSequence = getPositioningTagSequence(a, factionId);
    const bSequence = getPositioningTagSequence(b, factionId);
    return aSequence - bSequence;
  });
}
