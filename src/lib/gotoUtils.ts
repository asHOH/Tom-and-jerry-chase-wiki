// Utility for resolving goto targets by name

import { buffs, type Skill } from '@/data';
import type { GotoResult, CategoryHint } from '@/lib/types';
import { stringMatch } from './stringMatch';
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
  const filtered = normalizedCategory
    ? candidates.filter((c) => {
        if (normalizedCategory === '道具组') return c.kind === 'itemGroup';
        if (normalizedCategory === '知识卡') return c.kind === 'card';
        if (normalizedCategory === '状态') return c.kind === 'buff';
        if (normalizedCategory === '特技')
          return c.kind === 'special-skill-cat' || c.kind === 'special-skill-mouse';
        if (normalizedCategory === '技能') return c.kind === 'character-skill';
        if (normalizedCategory === '道具')
          return c.kind === 'item' || c.kind === 'entity-cat' || c.kind === 'entity-mouse';
        if (normalizedCategory === '衍生物')
          return c.kind === 'entity-cat' || c.kind === 'entity-mouse';
        return true;
      })
    : candidates;

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
  const fuzzyBuff = Object.values(buffs).find((i) => i.aliases?.find((n) => stringMatch(n, name)));
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
