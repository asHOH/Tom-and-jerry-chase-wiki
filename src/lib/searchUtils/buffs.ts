import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { FactionId, SingleItem, SingleItemTypeName } from '@/data/types';
import allBuffDetailedDescriptionsRaw from '@/features/buffs/data/allBuffDetailedDescriptions.json';
import { buffMappingTable } from '@/features/buffs/data/buffMappingTable';

import { getSingleItemHref } from '../singleItemTools';
import { commonSearchFields, type SearchQuery } from './matching';
import type { SearchResult } from './types';

const allBuffDetailedDescriptions = allBuffDetailedDescriptionsRaw as Record<string, string>;

const detailedBuffHrefs = new Map<string, string>();
const referenceTypes = new Set<SingleItemTypeName>([
  'knowledgeCard',
  'specialSkill',
  'item',
  'entity',
  'buff',
  'fixture',
  'mode',
  'skill',
]);

for (const [mappingKey, buffIds] of Object.entries(buffMappingTable)) {
  const [name, type, factionId] = mappingKey.split('|');
  if (!name || !type || !referenceTypes.has(type as SingleItemTypeName)) continue;

  const reference: SingleItem = {
    name,
    type: type as SingleItemTypeName,
    ...(factionId === 'cat' || factionId === 'mouse' ? { factionId: factionId as FactionId } : {}),
  };
  const href = getSingleItemHref(reference);
  if (href === '/error') continue;

  for (const buffId of buffIds) {
    const id = String(buffId);
    if (!detailedBuffHrefs.has(id)) detailedBuffHrefs.set(id, href);
  }
}

const getDetailedBuffDisplayName = (rawName: string): string =>
  /^\[([^\]]+)\]\([^)]*\)$/.exec(rawName)?.[1] ?? rawName;

const detailedBuffs = Object.entries(allBuffDetailedDescriptions).flatMap(
  ([buffId, description]) => {
    const rawName = description.match(/^["“]([^"”]+)["”]/)?.[1];
    return rawName
      ? [
          {
            buffId,
            name: getDetailedBuffDisplayName(rawName),
            description,
            href: detailedBuffHrefs.get(buffId),
          },
        ]
      : [];
  }
);

export async function searchBuffs(
  query: SearchQuery,
  buffs: PublishedGameDataByType['buffs']
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const [entityId, buff] of Object.entries(buffs)) {
    const match = await query.matchFields([
      ...commonSearchFields({
        ...buff,
        aliases: buff.aliases?.filter((alias) => !alias.startsWith('#') && !alias.startsWith('%')),
      }),
      [buff.stack, 'description'],
      [buff.detailedStack, 'detail'],
      [buff.sourceDescription, 'description'],
    ]);
    if (match)
      results.push({
        type: 'buff',
        href: `/buffs/${encodeURIComponent(entityId)}`,
        name: buff.name,
        imageUrl: buff.imageUrl,
        ...match,
      });
  }
  return results;
}

export async function searchDetailedBuffs(query: SearchQuery): Promise<SearchResult[]> {
  const { lowerCaseQuery, pinyinQuery } = query;
  const results: SearchResult[] = [];
  const shouldSearchPinyin = /^[a-z]+$/.test(pinyinQuery);

  for (const buff of detailedBuffs) {
    const match = await query.matchFields([
      [
        shouldSearchPinyin || buff.name.toLowerCase().includes(lowerCaseQuery)
          ? buff.name
          : undefined,
        'name',
      ],
      // Keep this large secondary corpus's descriptions limited to literal matches.
      [
        buff.description.toLowerCase().includes(lowerCaseQuery) ? buff.description : undefined,
        'description',
      ],
    ]);

    if (match) {
      results.push({
        type: 'buff',
        name: buff.name,
        ...match,
        detailedBuffId: buff.buffId,
        href: buff.href ? `${buff.href.split('#')[0]}#buff-${buff.buffId}` : '/buffs',
      });
    }
  }
  return results;
}
