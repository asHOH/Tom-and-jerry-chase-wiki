// Utility for resolving goto targets by name

import { characters, cards, items, specialSkills } from '@/data';
import { getDocPages } from '@/lib/docUtils';
import type { GotoResult } from '@/lib/types';

/**
 * Resolves a name to a goto result (url and type).
 * Returns null if no match is found.
 */
export async function getGotoResult(name: string): Promise<GotoResult | null> {
  if (name in characters) {
    return {
      url: `/characters/${encodeURIComponent(name)}`,
      type: 'character',
    };
  }
  if (name in cards) {
    return {
      url: `/cards/${encodeURIComponent(name)}`,
      type: 'card',
    };
  }
  if (name in items) {
    return {
      url: `/items/${encodeURIComponent(name)}`,
      type: 'item',
    };
  }
  if (name in specialSkills['cat']) {
    return {
      url: `/special-skills/cat/${encodeURIComponent(name)}`,
      type: 'special-skill-cat',
    };
  }
  if (name in specialSkills['mouse']) {
    return {
      url: `/special-skills/mouse/${encodeURIComponent(name)}`,
      type: 'special-skill-mouse',
    };
  }
  const docPages = await getDocPages();
  const docPage = docPages.find((page) => page.slug === name || page.title === name);
  if (docPage) {
    return {
      url: `/docs/${encodeURIComponent(docPage.slug)}`,
      type: 'doc',
    };
  }
  const character = Object.values(characters).find((c) => c.aliases?.includes(name));
  if (character) {
    return {
      url: `/characters/${encodeURIComponent(character.id)}`,
      type: 'character',
    };
  }
  const item = Object.values(items).find((i) => i.aliases?.includes(name));
  if (item) {
    return {
      url: `/items/${encodeURIComponent(item.name)}`,
      type: 'item',
    };
  }
  const catSkill = Object.values(specialSkills['cat']).find((s) => s.aliases?.includes(name));
  if (catSkill) {
    return {
      url: `/special-skills/cat/${encodeURIComponent(catSkill.name)}`,
      type: 'special-skill-cat',
    };
  }
  const mouseSkill = Object.values(specialSkills['mouse']).find((s) => s.aliases?.includes(name));
  if (mouseSkill) {
    return {
      url: `/special-skills/mouse/${encodeURIComponent(mouseSkill.name)}`,
      type: 'special-skill-mouse',
    };
  }
  const skill = Object.values(characters)
    .flatMap((c) => c.skills)
    .find((skill) => skill.name === name || skill.aliases?.includes(name));
  if (skill) {
    return {
      url: `/characters/${skill.id.split('-')[0]}#Skill:${encodeURIComponent(skill.name)}`,
      type: 'character-skill',
    };
  }
  return null;
}
