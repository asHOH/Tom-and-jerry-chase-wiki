import type {
  CatPositioningTagName,
  FactionId,
  MousePositioningTagName,
  PositioningTagLevel,
} from '@/data/types';

// Define display sequences for positioning tags
const CAT_POSITIONING_TAG_SEQUENCE: CatPositioningTagName[] = [
  '进攻',
  '防守',
  '追击',
  '打架',
  '速通',
  '后期',
  '翻盘',
];

const MOUSE_POSITIONING_TAG_SEQUENCE: MousePositioningTagName[] = [
  '奶酪',
  '干扰',
  '救援',
  '辅助',
  '破局',
  '砸墙',
  '后期',
];

type PositioningTagLevelSource = {
  readonly level?: unknown;
  readonly isMinor?: unknown;
};

export function getPositioningTagLevel(tag: PositioningTagLevelSource): PositioningTagLevel {
  if (tag.level === 0 || tag.level === 1 || tag.level === 2 || tag.level === 3 || tag.level === 4) {
    return tag.level;
  }

  // Approved public edit actions created before the level migration still contain isMinor.
  if (typeof tag.isMinor === 'boolean') {
    return tag.isMinor ? 2 : 4;
  }

  return 0;
}

/**
 * Get the display sequence for a specific tag within its faction
 */
function getPositioningTagSequence(tagName: string, factionId: FactionId): number {
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
 * Higher-level tags are shown first, then tags at the same level follow the faction sequence.
 */
export function sortPositioningTags<
  T extends { readonly tagName: string; readonly level?: PositioningTagLevel },
>(tags: readonly T[], factionId: FactionId): T[] {
  return Array.from(tags).sort((a, b) => {
    const levelDifference = getPositioningTagLevel(b) - getPositioningTagLevel(a);
    if (levelDifference !== 0) {
      return levelDifference;
    }

    const aSequence = getPositioningTagSequence(a.tagName, factionId);
    const bSequence = getPositioningTagSequence(b.tagName, factionId);
    return aSequence - bSequence;
  });
}

export function isPositioningTagMinor(level: PositioningTagLevel | undefined): boolean {
  return level === 2;
}

export function isPositioningTagVisible(
  level: PositioningTagLevel | undefined,
  isEditMode = false
): boolean {
  return isEditMode || (level ?? 0) >= 2;
}

/**
 * Sort positioning tag names according to their display sequence
 */
export function sortPositioningTagNames(tagNames: string[], factionId: FactionId): string[] {
  return tagNames.sort((a, b) => {
    const aSequence = getPositioningTagSequence(a, factionId);
    const bSequence = getPositioningTagSequence(b, factionId);
    return aSequence - bSequence;
  });
}
