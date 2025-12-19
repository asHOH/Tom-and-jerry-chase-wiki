// Utility for resolving goto targets by name

import type { CategoryHint, GotoResult } from '@/lib/types';
import { buffs, type Skill } from '@/data';

import { ensureGotoIndex, normalizeCategoryHint, normalizeName } from './gotoIndex';

/**
 * Resolves a name to a goto result (url and type).
 * Returns null if no match is found.
 */
// Category normalization is provided by gotoIndex.normalizeCategoryHint

export async function getGotoResult(
  name: string,
  category?: CategoryHint | (string & Record<never, never>)
): Promise<GotoResult | null> {
  const normalizedCategory = normalizeCategoryHint(category);
  const categoryPredicate = (hint?: CategoryHint) => {
    type K = { kind: string };
    if (!hint) return undefined as undefined | ((c: K) => boolean);
    if (hint === '组合') return (c: K) => c.kind === 'itemGroup';
    if (hint === '知识卡') return (c: K) => c.kind === 'card';
    if (hint === '状态') return (c: K) => c.kind === 'buff';
    if (hint === '特技')
      return (c: K) => c.kind === 'special-skill-cat' || c.kind === 'special-skill-mouse';
    if (hint === '技能') return (c: K) => c.kind === 'character-skill';
    if (hint === '道具')
      return (c: K) => c.kind === 'item' || c.kind === 'entity-cat' || c.kind === 'entity-mouse';
    if (hint === '衍生物') return (c: K) => c.kind === 'entity-cat' || c.kind === 'entity-mouse';
    if (hint === '地图') return (c: K) => c.kind === 'map';
    if (hint === '地图组件') return (c: K) => c.kind === 'fixture';
    if (hint === '场景物') return (c: K) => c.kind === 'fixture';
    return undefined;
  };
  // Parse skill level prefix like "2级技能名"
  let skillLevelRequested: number | null = null;
  let rawName = name;
  const levelMatch = /^(\d+)级(.+)$/.exec(name);
  if (levelMatch && levelMatch[1] && levelMatch[2]) {
    skillLevelRequested = parseInt(levelMatch[1] as string, 10);
    rawName = (levelMatch[2] as string).trim();
  }

  const { byName } = await ensureGotoIndex();
  const key = normalizeName(rawName);
  const candidates = byName.get(key) ?? [];
  const pred = categoryPredicate(normalizedCategory);
  const filtered = pred ? candidates.filter(pred as (c: { kind: string }) => boolean) : candidates;

  const chosen = filtered[0] ?? candidates[0];
  if (chosen) {
    if (chosen.kind === 'character-skill') {
      if (skillLevelRequested) {
        const lvl = chosen.skillMeta?.levels.find((l) => l.level === skillLevelRequested!);
        return {
          ...chosen.goto,
          skillLevel: skillLevelRequested,
          skillType: (chosen.skillMeta as { type: Skill['type'] }).type,
          ...(lvl ? { skillLevelDescription: lvl.detailedDescription || lvl.description } : {}),
        } as GotoResult;
      }
      return chosen.goto;
    }
    return chosen.goto;
  }

  // Fuzzy buff alias fallback (preserve existing behavior)
  // substitude RegExp for stringMatch()，RegExp identifier is '#' or '%'
  const fuzzyBuff = Object.values(buffs).find((i) =>
    i.aliases?.find((n) =>
      ['#', '%'].includes(n[0] || '') ? RegExp(n.slice(1)).test(name) : n === name
    )
  );
  if (fuzzyBuff) {
    return {
      url: `/buffs/${encodeURIComponent(fuzzyBuff.name)}`,
      type: 'buff',
      name: fuzzyBuff.name,
      description: fuzzyBuff.description,
      imageUrl: fuzzyBuff.imageUrl,
    };
  }

  return null;
}
