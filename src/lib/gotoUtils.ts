// Utility for resolving goto targets by name

import type {
  CategoryHint,
  GotoDisambiguationCandidate,
  GotoDisambiguationResult,
  GotoResponse,
  GotoResult,
} from '@/lib/types';
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
): Promise<GotoResponse | null> {
  const parseTrailingCategoryTemplate = (
    input: string
  ): { baseName: string; categoryHint?: CategoryHint } => {
    const trimmed = input.trim();
    if (!trimmed) return { baseName: input };

    // Support both ASCII (...) and full-width （...）. Only parse a trailing pair.
    const m = /^(.*?)[\s]*[（(]([^（）()]+)[)）]\s*$/.exec(trimmed);
    if (!m) return { baseName: input };

    const baseName = (m[1] ?? '').trim();
    const hintRaw = (m[2] ?? '').trim();
    const hint = normalizeCategoryHint(hintRaw);
    if (!baseName) return { baseName: input };
    if (!hint) return { baseName };
    return { baseName, categoryHint: hint };
  };

  const { baseName: templateBaseName, categoryHint: templateCategory } =
    parseTrailingCategoryTemplate(name);

  const normalizedCategory = normalizeCategoryHint(templateCategory ?? category);
  const descMode = options?.descMode ?? 'detailed';
  const categoryPredicate = (hint?: CategoryHint) => {
    type K = { kind: string };
    if (!hint) return undefined as undefined | ((c: K) => boolean);
    if (hint === '组合') return (c: K) => c.kind === 'itemGroup';
    if (hint === '知识卡') return (c: K) => c.kind === 'card';
    if (hint === '状态') return (c: K) => c.kind === 'buff';
    if (hint === '特技')
      return (c: K) => c.kind === 'special-skill-cat' || c.kind === 'special-skill-mouse';
    if (hint === '猫特技') return (c: K) => c.kind === 'special-skill-cat';
    if (hint === '鼠特技') return (c: K) => c.kind === 'special-skill-mouse';
    if (hint === '技能') return (c: K) => c.kind === 'character-skill';
    if (hint === '道具')
      return (c: K) => c.kind === 'item' || c.kind === 'entity-cat' || c.kind === 'entity-mouse';
    if (hint === '衍生物') return (c: K) => c.kind === 'entity-cat' || c.kind === 'entity-mouse';
    if (hint === '地图') return (c: K) => c.kind === 'map';
    if (hint === '地图组件') return (c: K) => c.kind === 'fixture';
    if (hint === '场景物') return (c: K) => c.kind === 'fixture';
    if (hint === '游戏模式') return (c: K) => c.kind === 'mode';
    if (hint === '模式') return (c: K) => c.kind === 'mode';
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
  let rawName = templateBaseName;
  const levelMatch = /^([12一二])级(.+)$/.exec(rawName.trim());
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
  const pool = filtered.length > 0 ? filtered : candidates;

  const deduped = (() => {
    const seen = new Set<string>();
    const out: typeof pool = [];
    for (const c of pool) {
      const k = `${c.kind}@@${c.goto.url}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(c);
    }
    return out;
  })();

  const kindLabel = (kind: string): { categoryLabel: string; kindDescription: string } => {
    if (kind === 'character') return { categoryLabel: '角色', kindDescription: '角色' };
    if (kind === 'card') return { categoryLabel: '知识卡', kindDescription: '知识卡' };
    if (kind === 'item') return { categoryLabel: '道具', kindDescription: '道具' };
    if (kind === 'itemGroup') return { categoryLabel: '组合', kindDescription: '组合' };
    if (kind === 'buff') return { categoryLabel: '状态', kindDescription: '状态' };
    if (kind === 'special-skill-cat')
      return { categoryLabel: '猫特技', kindDescription: '猫方特技' };
    if (kind === 'special-skill-mouse')
      return { categoryLabel: '鼠特技', kindDescription: '鼠方特技' };
    if (kind === 'character-skill') return { categoryLabel: '技能', kindDescription: '角色技能' };
    if (kind === 'entity-cat') return { categoryLabel: '衍生物', kindDescription: '猫方衍生物' };
    if (kind === 'entity-mouse') return { categoryLabel: '衍生物', kindDescription: '鼠方衍生物' };
    if (kind === 'map') return { categoryLabel: '地图', kindDescription: '地图' };
    if (kind === 'fixture')
      return { categoryLabel: '地图组件', kindDescription: '地图组件/场景物' };
    if (kind === 'mode') return { categoryLabel: '游戏模式', kindDescription: '游戏模式' };
    if (kind === 'doc') return { categoryLabel: '文档', kindDescription: '文档' };
    return { categoryLabel: kind, kindDescription: kind };
  };

  const toDisambiguationCandidate = (
    entry: (typeof deduped)[number]
  ): GotoDisambiguationCandidate => {
    const { categoryLabel, kindDescription } = kindLabel(entry.kind);
    return {
      url: entry.goto.url,
      type: entry.goto.type,
      name: entry.goto.name,
      categoryLabel,
      kindDescription,
    };
  };

  if (deduped.length >= 2) {
    const firstImage = deduped[0]?.goto.imageUrl;
    const disambiguationUrl = (() => {
      const sp = new URLSearchParams();
      if (normalizedCategory) sp.set('category', normalizedCategory);
      const qs = sp.toString();
      return `/goto/${encodeURIComponent(rawName)}${qs ? `?${qs}` : ''}`;
    })();
    const disambiguation: GotoDisambiguationResult = {
      url: disambiguationUrl,
      type: 'disambiguation',
      name: rawName,
      description: `${rawName}可能指：`,
      ...(firstImage ? { imageUrl: firstImage } : {}),
      candidates: deduped.map(toDisambiguationCandidate),
    };
    return disambiguation;
  }

  const chosen = deduped[0];
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
