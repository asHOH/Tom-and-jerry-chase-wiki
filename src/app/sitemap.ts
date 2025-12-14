import { MetadataRoute } from 'next';
import { buffs, cards, characters, entities, items, specialSkills } from '@/data';
import docPages from '@/data/generated/docPages.json';
import { RANKABLE_PROPERTIES } from '@/features/characters/utils/ranking';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tjwiki.com';
  const buildTime = new Date(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP!);

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

  const entitiesMap: MetadataRoute.Sitemap = [
    ...Object.keys(entities.cat),
    ...Object.keys(entities.mouse),
  ].map((entityName) => ({
    url: `${baseUrl}/entities/${encodeURIComponent(entityName)}`,
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

  const docsMap: MetadataRoute.Sitemap = docPages.map((doc) => ({
    url: `${baseUrl}${doc.path}`,
    lastModified: buildTime,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
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
    ...docsMap,
    // Tools
    {
      url: `${baseUrl}/tools`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
