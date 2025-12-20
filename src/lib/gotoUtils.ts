// Utility for resolving goto targets by name

import type { CategoryHint, GotoResult } from '@/lib/types';
import { buffs, characters, type Skill } from '@/data';

import { ensureGotoIndex, normalizeCategoryHint, normalizeName } from './gotoIndex';

/**
 * Resolves a name to a goto result (url and type).
 * Returns null if no match is found.
 */
// Category normalization is provided by gotoIndex.normalizeCategoryHint

export async function getGotoResult(
  name: string,
  category?: CategoryHint | (string & Record<never, never>),
  options?: {
    descMode?: 'description' | 'detailed';
  }
): Promise<GotoResult | null> {
  const normalizedCategory = normalizeCategoryHint(category);
  const descMode = options?.descMode ?? 'detailed';
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
  const compact = (input: string): string =>
    normalizeName(input)
      .replace(/[\s\-_:：·•—–/\\、,，.。()（）\[\]{}【】「」'"“”]+/g, '')
      .trim();

  const parseOneTwo = (s: string): 1 | 2 | null => {
    if (s === '1' || s === '一') return 1;
    if (s === '2' || s === '二') return 2;
    return null;
  };

  const formatCharacterDisplayName = (ownerId: string): string => {
    const c = characters[ownerId as keyof typeof characters];
    if (!c) return ownerId;
    return c.id === ownerId ? c.id : `${c.id}（${ownerId}）`;
  };

  const chooseSkillDescription = (s: Skill): string | undefined => {
    if (descMode === 'description') return s.description;
    return s.detailedDescription || s.description;
  };

  const chooseSkillLevelDescription = (lvl: {
    description: string;
    detailedDescription?: string;
  }) => {
    if (descMode === 'description') return lvl.description;
    return lvl.detailedDescription || lvl.description;
  };

  const parseSkillSlot = (rest: string): Skill['type'] | null => {
    if (/^(?:主动技能|主动|主(?:动)?|主技能|(?:1|一)主)$/.test(rest)) return 'active';
    if (/^(?:被动技能|被动|被(?:动)?|被技能|(?:1|一)被)$/.test(rest)) return 'passive';
    if (/^(?:(?:1|一)武(?:器)?|武(?:器)?1|武(?:器)?一|武1|武一|武器技能(?:1|一)?)$/.test(rest))
      return 'weapon1';
    if (/^(?:(?:2|二)武(?:器)?|武(?:器)?2|武(?:器)?二|武2|武二|武器技能2)$/.test(rest))
      return 'weapon2';
    return null;
  };

  // Parse skill level prefix like "2级技能名" / "一级技能名" (only 1/2, 一/二)
  let skillLevelRequested: number | null = null;
  let rawName = name;
  const levelMatch = /^([12一二])级(.+)$/.exec(name.trim());
  if (levelMatch && levelMatch[1] && levelMatch[2]) {
    const parsed = parseOneTwo(levelMatch[1]);
    if (parsed) {
      skillLevelRequested = parsed;
      rawName = (levelMatch[2] as string).trim();
    }
  }

  // Owner + skill composite patterns, owner-skill always wins.
  // Examples: 汤姆无敌 / 汤姆主动技能 / 汤姆一被 / 汤姆一武 / 汤姆二武
  const compactQuery = compact(rawName);
  if (compactQuery) {
    type OwnerToken = { token: string; ownerId: string };
    let bestOwner: OwnerToken | null = null;
    for (const [ownerId, c] of Object.entries(characters)) {
      const candidates = [ownerId, c.id, ...(c.aliases ?? [])]
        .map((t) => compact(t))
        .filter(Boolean);
      for (const token of candidates) {
        if (!compactQuery.startsWith(token)) continue;
        if (!bestOwner || token.length > bestOwner.token.length) {
          bestOwner = { token, ownerId };
        }
      }
    }

    if (bestOwner) {
      const ownerId = bestOwner.ownerId;
      const owner = characters[ownerId as keyof typeof characters];
      const rest = compactQuery.slice(bestOwner.token.length);
      if (owner && rest) {
        const slot = parseSkillSlot(rest);
        let resolvedSkill: Skill | null = null;

        const skills = (owner.skills as Skill[]) ?? [];
        if (slot) {
          resolvedSkill = skills.find((s) => s.type === slot) ?? null;
        } else {
          resolvedSkill =
            skills.find((s) => compact(s.name) === rest) ??
            skills.find((s) => (s.aliases ?? []).some((a) => compact(a) === rest)) ??
            null;
        }

        if (resolvedSkill) {
          const baseUrl = `/characters/${encodeURIComponent(ownerId)}#Skill:${encodeURIComponent(
            resolvedSkill.name
          )}`;
          const result: GotoResult = {
            url: baseUrl,
            type: 'character-skill',
            name: resolvedSkill.name,
            description: chooseSkillDescription(resolvedSkill),
            imageUrl: resolvedSkill.imageUrl,
            ownerName: formatCharacterDisplayName(ownerId),
            ...(owner.factionId ? { ownerFactionId: owner.factionId } : {}),
          };

          if (skillLevelRequested) {
            const lvl = resolvedSkill.skillLevels.find((l) => l.level === skillLevelRequested);
            return {
              ...result,
              skillLevel: skillLevelRequested,
              skillType: resolvedSkill.type,
              ...(lvl ? { skillLevelDescription: chooseSkillLevelDescription(lvl) } : {}),
            };
          }
          return result;
        }
      }
    }
  }

  const { byName } = await ensureGotoIndex();
  const key = normalizeName(rawName);
  const candidates = byName.get(key) ?? [];
  const pred = categoryPredicate(normalizedCategory);
  const filtered = pred ? candidates.filter(pred as (c: { kind: string }) => boolean) : candidates;

  const chosen = filtered[0] ?? candidates[0];
  if (chosen) {
    if (chosen.kind === 'character-skill') {
      const maybeOverrideSkillDescription = (): string | undefined => {
        if (descMode !== 'detailed') return chosen.goto.description;
        const ownerId = chosen.skillMeta?.ownerId;
        if (!ownerId) return chosen.goto.description;
        const owner = characters[ownerId as keyof typeof characters];
        if (!owner) return chosen.goto.description;
        const skillName = chosen.goto.name;
        const skill = (owner.skills as Skill[]).find((s) => s.name === skillName);
        return skill ? chooseSkillDescription(skill) : chosen.goto.description;
      };

      if (skillLevelRequested) {
        const lvl = chosen.skillMeta?.levels.find((l) => l.level === skillLevelRequested!);
        return {
          ...chosen.goto,
          description: maybeOverrideSkillDescription(),
          skillLevel: skillLevelRequested,
          skillType: (chosen.skillMeta as { type: Skill['type'] }).type,
          ...(lvl ? { skillLevelDescription: chooseSkillLevelDescription(lvl) } : {}),
        } as GotoResult;
      }
      return {
        ...chosen.goto,
        description: maybeOverrideSkillDescription(),
      };
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
