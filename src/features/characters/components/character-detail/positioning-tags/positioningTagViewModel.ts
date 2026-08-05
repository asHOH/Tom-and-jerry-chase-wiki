import {
  getPositioningTagLevel,
  getPositioningTagNames,
} from '@/constants/positioningTagSequences';
import type { FactionId, PositioningTagLevel } from '@/data/types';

export const POSITIONING_TAG_VIEW_MODES = ['text', 'bar', 'radar'] as const;

export type PositioningTagViewMode = (typeof POSITIONING_TAG_VIEW_MODES)[number];

export type PositioningTagChartInput = {
  readonly tagName: string;
  readonly level?: PositioningTagLevel;
  readonly isMinor?: boolean;
};

export type PositioningTagChartDatum = {
  readonly tagName: string;
  readonly level: PositioningTagLevel;
};

export function normalizePositioningTagViewMode(value: string | null | undefined) {
  // Migrate the previous persisted rose-chart preference to the radar chart.
  if (value === 'rose') return 'radar';

  return POSITIONING_TAG_VIEW_MODES.includes(value as PositioningTagViewMode)
    ? (value as PositioningTagViewMode)
    : 'text';
}

/**
 * Build a stable seven-axis data set for the character's faction.
 *
 * Public charts use level 1 as the visual baseline for unspecified axes and
 * source levels 0/1. If malformed or legacy data contains the same tag more
 * than once, the highest level wins.
 */
export function getPositioningTagChartData(
  tags: readonly PositioningTagChartInput[],
  factionId: FactionId
): readonly PositioningTagChartDatum[] {
  const levelsByName = new Map<string, PositioningTagLevel>();

  for (const tag of tags) {
    const level = getPositioningTagLevel(tag);
    const currentLevel = levelsByName.get(tag.tagName) ?? 0;
    levelsByName.set(tag.tagName, Math.max(currentLevel, level) as PositioningTagLevel);
  }

  return getPositioningTagNames(factionId).map((tagName) => {
    const level = levelsByName.get(tagName) ?? 0;
    return {
      tagName,
      level: level >= 2 ? level : 1,
    };
  });
}
