// Utility for resolving goto targets by name

import { characters, cards, items, specialSkills, entities } from '@/data';
import { getDocPages } from '@/lib/docUtils';
import type { GotoResult, CategoryHint } from '@/lib/types';
import { CATEGORY_HINTS } from '@/lib/types';

/**
 * Resolves a name to a goto result (url and type).
 * Returns null if no match is found.
 */
function normalizeCategoryHint(raw?: string): CategoryHint | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  // Only accept known hints (single source of truth)
  return (CATEGORY_HINTS as readonly string[]).includes(v) ? (v as CategoryHint) : undefined;
}

export async function getGotoResult(
  name: string,
  category?: CategoryHint | string
): Promise<GotoResult | null> {
  const normalizedCategory = normalizeCategoryHint(category);
  if (name in characters) {
    const c = characters[name];
    return {
      url: `/characters/${encodeURIComponent(name)}`,
      type: 'character',
      name: c!.id,
      description: c!.description,
      imageUrl: c!.imageUrl,
    };
  }
  if ((!normalizedCategory || normalizedCategory === '知识卡') && name in cards) {
    const card = cards[name];
    return {
      url: `/cards/${encodeURIComponent(name)}`,
      type: 'card',
      name: card!.id,
      description: card!.description,
      imageUrl: card!.imageUrl,
    };
  }
  if (
    (!normalizedCategory || normalizedCategory === '衍生物' || normalizedCategory === '道具') &&
    name in entities['cat']
  ) {
    const entity = entities['cat'][name];
    return {
      url: `/entities/${encodeURIComponent(name)}`,
      type: 'entity',
      name: entity!.name,
      description: entity!.description,
      imageUrl: entity!.imageUrl,
    };
  }
  if (
    (!normalizedCategory || normalizedCategory === '衍生物' || normalizedCategory === '道具') &&
    name in entities['mouse']
  ) {
    const entity = entities['mouse'][name];
    return {
      url: `/entities/${encodeURIComponent(name)}`,
      type: 'entity',
      name: entity!.name,
      description: entity!.description,
      imageUrl: entity!.imageUrl,
    };
  }
  if ((!normalizedCategory || normalizedCategory === '道具') && name in items) {
    const item = items[name];
    return {
      url: `/items/${encodeURIComponent(name)}`,
      type: 'item',
      name: item!.name,
      description: item!.description,
      imageUrl: item!.imageUrl,
    };
  }
  if ((!normalizedCategory || normalizedCategory === '特技') && name in specialSkills['cat']) {
    const skill = specialSkills['cat'][name];
    return {
      url: `/special-skills/cat/${encodeURIComponent(name)}`,
      type: 'special-skill-cat',
      name: skill!.name,
      description: skill!.description,
      imageUrl: skill!.imageUrl,
    };
  }
  if ((!normalizedCategory || normalizedCategory === '特技') && name in specialSkills['mouse']) {
    const skill = specialSkills['mouse'][name];
    return {
      url: `/special-skills/mouse/${encodeURIComponent(name)}`,
      type: 'special-skill-mouse',
      name: skill!.name,
      description: skill!.description,
      imageUrl: skill!.imageUrl,
    };
  }
  const docPages = await getDocPages();
  const docPage = docPages.find((page) => page.slug === name || page.title === name);
  if (docPage) {
    return {
      url: `/docs/${encodeURIComponent(docPage.slug)}`,
      type: 'doc',
      name: docPage!.title,
      description: '',
      imageUrl: undefined,
    };
  }
  const character = Object.values(characters).find((c) => c.aliases?.includes(name));
  if (character) {
    return {
      url: `/characters/${encodeURIComponent(character.id)}`,
      type: 'character',
      name: character!.id,
      description: character!.description,
      imageUrl: character!.imageUrl,
    };
  }
  const catEntity = Object.values(entities['cat']).find((i) => i.aliases?.includes(name));
  if (catEntity) {
    return {
      url: `/entities/${encodeURIComponent(catEntity.name)}`,
      type: 'entity',
      name: catEntity!.name,
      description: catEntity!.description,
      imageUrl: catEntity!.imageUrl,
    };
  }
  const mouseEntity = Object.values(entities['mouse']).find((i) => i.aliases?.includes(name));
  if (mouseEntity) {
    return {
      url: `/entities/${encodeURIComponent(mouseEntity.name)}`,
      type: 'entity',
      name: catEntity!.name,
      description: catEntity!.description,
      imageUrl: catEntity!.imageUrl,
    };
  }
  const item = Object.values(items).find((i) => i.aliases?.includes(name));
  if (item) {
    return {
      url: `/items/${encodeURIComponent(item.name)}`,
      type: 'item',
      name: item!.name,
      description: item!.description,
      imageUrl: item!.imageUrl,
    };
  }
  const catSkill = Object.values(specialSkills['cat']).find((s) => s.aliases?.includes(name));
  if (catSkill) {
    return {
      url: `/special-skills/cat/${encodeURIComponent(catSkill.name)}`,
      type: 'special-skill-cat',
      name: catSkill!.name,
      description: catSkill!.description,
      imageUrl: catSkill!.imageUrl,
    };
  }
  const mouseSkill = Object.values(specialSkills['mouse']).find((s) => s.aliases?.includes(name));
  if (mouseSkill) {
    return {
      url: `/special-skills/mouse/${encodeURIComponent(mouseSkill.name)}`,
      type: 'special-skill-mouse',
      name: mouseSkill!.name,
      description: mouseSkill!.description,
      imageUrl: mouseSkill!.imageUrl,
    };
  }
  const skill = Object.values(characters)
    .flatMap((c) => c.skills)
    .find((skill) => skill.name === name || skill.aliases?.includes(name));
  if ((!normalizedCategory || normalizedCategory === '技能') && skill) {
    return {
      url: `/characters/${skill.id.split('-')[0]}#Skill:${encodeURIComponent(skill.name)}`,
      type: 'character-skill',
      name: skill!.name,
      description: skill!.description,
      imageUrl: skill!.imageUrl,
    };
  }
  return null;
}
