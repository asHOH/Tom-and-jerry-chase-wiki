import { MetadataRoute } from 'next';

import { normalizeUrlWithTrailingSlash } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { RANKABLE_PROPERTIES } from '@/features/characters/utils/ranking';
import { mechanicsSectionsList } from '@/features/mechanics/sections';
import {
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';
import { env } from '@/env';

export const dynamic = 'force-static';

function normalizeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    ...entry,
    url: normalizeUrlWithTrailingSlash(entry.url),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const buildTime = env.NEXT_PUBLIC_BUILD_TIMESTAMP
    ? new Date(env.NEXT_PUBLIC_BUILD_TIMESTAMP)
    : new Date();

  const charactersMap: MetadataRoute.Sitemap = Object.keys(characters).map((characterId) => ({
    url: `${baseUrl}/characters/${encodeURIComponent(characterId)}`,
    lastModified: buildTime,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const cardsMap: MetadataRoute.Sitemap = Object.keys(cards).map((cardId) => ({
    url: `${baseUrl}/cards/${encodeURIComponent(cardId)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const specialSkillsMap: MetadataRoute.Sitemap = [
    ...Object.keys(specialSkills.cat).map((skillId) => `cat/${skillId}`),
    ...Object.keys(specialSkills.mouse).map((skillId) => `mouse/${skillId}`),
  ].map((skillPath) => ({
    url: `${baseUrl}/special-skills/${encodeURIComponent(skillPath)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const itemsMap: MetadataRoute.Sitemap = Object.keys(items).map((itemName) => ({
    url: `${baseUrl}/items/${encodeURIComponent(itemName)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const buffsMap: MetadataRoute.Sitemap = Object.keys(buffs).map((buffName) => ({
    url: `${baseUrl}/buffs/${encodeURIComponent(buffName)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const entitiesMap: MetadataRoute.Sitemap = Object.keys(entities).map((entityName) => ({
    url: `${baseUrl}/entities/${encodeURIComponent(entityName)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const mapsMap: MetadataRoute.Sitemap = Object.keys(maps).map((mapId) => ({
    url: `${baseUrl}/maps/${encodeURIComponent(mapId)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const modesMap: MetadataRoute.Sitemap = Object.keys(modes).map((modeId) => ({
    url: `${baseUrl}/modes/${encodeURIComponent(modeId)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const fixturesMap: MetadataRoute.Sitemap = Object.keys(fixtures).map((fixtureId) => ({
    url: `${baseUrl}/fixtures/${encodeURIComponent(fixtureId)}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const mechanicsMap: MetadataRoute.Sitemap = mechanicsSectionsList.map((section) => ({
    url: `${baseUrl}/mechanics/${section}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.4,
  }));

  const ranksMap: MetadataRoute.Sitemap = RANKABLE_PROPERTIES.map((property) => ({
    url: `${baseUrl}/ranks/${property.key}`,
    lastModified: buildTime,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Characters
    {
      url: `${baseUrl}/factions/cat`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/factions/mouse`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...charactersMap,
    // Knowledge Cards
    {
      url: `${baseUrl}/cards`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...cardsMap,
    // Special Skills
    {
      url: `${baseUrl}/special-skills`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/special-skills/advice`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...specialSkillsMap,
    // Items
    {
      url: `${baseUrl}/items`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...itemsMap,
    // Entities
    {
      url: `${baseUrl}/entities`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...entitiesMap,
    // Buffs
    {
      url: `${baseUrl}/buffs`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...buffsMap,
    // Maps
    {
      url: `${baseUrl}/maps`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...mapsMap,
    // Modes
    {
      url: `${baseUrl}/modes`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...modesMap,
    // Fixtures
    {
      url: `${baseUrl}/fixtures`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...fixturesMap,
    // Mechanics
    {
      url: `${baseUrl}/mechanics`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...mechanicsMap,
    // Rankings
    {
      url: `${baseUrl}/ranks`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...ranksMap,
    // Docs
    {
      url: `${baseUrl}/docs`,
      lastModified: buildTime,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Tools
    {
      url: `${baseUrl}/tools`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Other
    {
      url: `${baseUrl}/win-rates`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // Note: /recommended/ is excluded because it has noindex.
    // /docs/* is excluded because those MDX pages inherit docs layout noindex.
    // /achievements/, /itemGroups/, and /usages/ are omitted intentionally because
    // they are visitable utility/reference pages, not part of the primary search surface.
  ];

  return normalizeSitemapEntries(entries);
}
