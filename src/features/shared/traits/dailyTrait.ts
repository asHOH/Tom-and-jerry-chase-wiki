import { formatDateKey, getGameDate, seededRandom } from '@/lib/gameUtils';
import type { Trait } from '@/data/types';

export type DailyTraitSelection = {
  dateKey: string;
  traitKey: string;
  trait: Trait;
};

/**
 * Picks the trait of the day. The selection is deterministic for a given
 * Asia/Shanghai calendar date, so every visitor sees the same trait that day.
 */
export function pickDailyTrait(
  traits: Record<string, Trait>,
  date: Date = getGameDate()
): DailyTraitSelection | null {
  const traitKeys = Object.keys(traits)
    .filter((key) => !traits[key]?.relation)
    .sort();

  if (traitKeys.length === 0) return null;

  const dateKey = formatDateKey(date);
  const random = seededRandom(`daily-trait:${dateKey}`);
  const traitKey = traitKeys[Math.floor(random() * traitKeys.length)]!;

  return { dateKey, traitKey, trait: traits[traitKey]! };
}
