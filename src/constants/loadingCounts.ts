export const LOADING_COUNTS = {
  knowledgeCards: 72,
  factionCharacters: {
    cat: 20,
    mouse: 35,
  },
  specialSkills: 15,
  specialSkillAdvice: 15,
  items: 53,
  buffs: 94,
  entities: 158,
  fixtures: 65,
  maps: 28,
  modes: 20,
  itemGroups: 27,
  rankings: 55,
  mechanicsSections: 9,
  usagesSections: 2,
  tools: 8,
} as const;

export type FactionLoadingId = keyof typeof LOADING_COUNTS.factionCharacters;

export function getFactionLoadingCount(pathname: string | null | undefined) {
  if (pathname?.includes('/factions/cat')) {
    return LOADING_COUNTS.factionCharacters.cat;
  }

  if (pathname?.includes('/factions/mouse')) {
    return LOADING_COUNTS.factionCharacters.mouse;
  }

  return LOADING_COUNTS.factionCharacters.mouse;
}
