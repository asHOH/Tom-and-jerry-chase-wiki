import { MetadataRoute } from 'next';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { normalizeUrlWithTrailingSlash } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { RANKABLE_PROPERTIES } from '@/features/characters/utils/ranking';
import itemGroups from '@/features/items/data/itemGroups';
import { mechanicsSectionsList } from '@/features/mechanics/sections';
import { usagesSectionsList } from '@/features/usages/sections';

export const dynamic = 'force-static';

function normalizeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    ...entry,
    url: normalizeUrlWithTrailingSlash(entry.url),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {
    data: {
      achievements,
      buffs,
      cards,
      characters,
      entities,
      fixtures,
      items,
      maps,
      modes,
      specialSkills,
    },
  } = await getPublishedGameDataSnapshot();
  const baseUrl = SITE_URL;
  // shortcut: omit unverified lastModified values, restore when per-page content dates are tracked.

  const charactersMap: MetadataRoute.Sitemap = Object.keys(characters).map((characterId) => ({
    url: `${baseUrl}/characters/${encodeURIComponent(characterId)}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const cardsMap: MetadataRoute.Sitemap = Object.keys(cards).map((cardId) => ({
    url: `${baseUrl}/cards/${encodeURIComponent(cardId)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const specialSkillsMap: MetadataRoute.Sitemap = (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys(specialSkills[factionId]).map((skillId) => ({
      url: `${baseUrl}/special-skills/${encodeURIComponent(factionId)}/${encodeURIComponent(skillId)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))
  );

  const itemsMap: MetadataRoute.Sitemap = Object.keys(items).map((itemName) => ({
    url: `${baseUrl}/items/${encodeURIComponent(itemName)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const itemGroupsMap: MetadataRoute.Sitemap = Object.keys(itemGroups).map((itemGroupName) => ({
    url: `${baseUrl}/itemGroups/${encodeURIComponent(itemGroupName)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const buffsMap: MetadataRoute.Sitemap = Object.keys(buffs).map((buffName) => ({
    url: `${baseUrl}/buffs/${encodeURIComponent(buffName)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const entitiesMap: MetadataRoute.Sitemap = Object.keys(entities).map((entityName) => ({
    url: `${baseUrl}/entities/${encodeURIComponent(entityName)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const mapsMap: MetadataRoute.Sitemap = Object.keys(maps).map((mapId) => ({
    url: `${baseUrl}/maps/${encodeURIComponent(mapId)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const modesMap: MetadataRoute.Sitemap = Object.keys(modes).map((modeId) => ({
    url: `${baseUrl}/modes/${encodeURIComponent(modeId)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const fixturesMap: MetadataRoute.Sitemap = Object.keys(fixtures).map((fixtureId) => ({
    url: `${baseUrl}/fixtures/${encodeURIComponent(fixtureId)}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const mechanicsMap: MetadataRoute.Sitemap = mechanicsSectionsList.map((section) => ({
    url: `${baseUrl}/mechanics/${section}`,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const ranksMap: MetadataRoute.Sitemap = RANKABLE_PROPERTIES.map((property) => ({
    url: `${baseUrl}/ranks/${property.key}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const achievementsMap: MetadataRoute.Sitemap = (['cat', 'mouse'] as const).flatMap((factionId) =>
    Object.keys(achievements[factionId]).map((achievementName) => ({
      url: `${baseUrl}/achievements/${factionId}/${encodeURIComponent(achievementName)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))
  );

  const usagesMap: MetadataRoute.Sitemap = usagesSectionsList.map((section) => ({
    url: `${baseUrl}/usages/${section}`,
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  const statShowdownModes = ['all', 'cats', 'mice', 'blitz'] as const;
  const statShowdownModesMap: MetadataRoute.Sitemap = statShowdownModes.map((mode) => ({
    url: `${baseUrl}/games/stat-showdown/${mode}`,
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Characters
    {
      url: `${baseUrl}/factions/cat`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/factions/mouse`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/relations`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...charactersMap,
    // Knowledge Cards
    {
      url: `${baseUrl}/cards`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...cardsMap,
    // Special Skills
    {
      url: `${baseUrl}/special-skills`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/special-skills/advice`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...specialSkillsMap,
    // Items
    {
      url: `${baseUrl}/items`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...itemsMap,
    // Item Groups
    {
      url: `${baseUrl}/itemGroups`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...itemGroupsMap,
    // Entities
    {
      url: `${baseUrl}/entities`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...entitiesMap,
    // Buffs
    {
      url: `${baseUrl}/buffs`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...buffsMap,
    // Maps
    {
      url: `${baseUrl}/maps`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...mapsMap,
    // Modes
    {
      url: `${baseUrl}/modes`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...modesMap,
    // Fixtures
    {
      url: `${baseUrl}/fixtures`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...fixturesMap,
    // Mechanics
    {
      url: `${baseUrl}/mechanics`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...mechanicsMap,
    // Rankings
    {
      url: `${baseUrl}/ranks`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...ranksMap,
    // Docs
    {
      url: `${baseUrl}/docs`,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Tools
    {
      url: `${baseUrl}/tools`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/recent-changes`,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    // Games
    {
      url: `${baseUrl}/games`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/guess-character`,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/games/playstyle-quiz`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/games/stat-showdown`,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...statShowdownModesMap,
    // Achievements
    {
      url: `${baseUrl}/achievements`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...achievementsMap,
    // Usage Guides
    {
      url: `${baseUrl}/usages`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...usagesMap,
    // Other
    {
      url: `${baseUrl}/win-rates`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Note: /recommended/ is excluded because it has noindex.
    // /docs/* sub-pages are excluded because they inherit docs layout noindex.
    // /articles/* (new, edit, pending, preview, history) are editor/management pages.
    // /admin/ is auth-protected. /offline/ is a PWA fallback.
    // /goto/:name is an internal redirect utility.
    // /characters/user/:characterId is user-generated content (force-dynamic).
  ];

  return normalizeSitemapEntries(entries);
}
