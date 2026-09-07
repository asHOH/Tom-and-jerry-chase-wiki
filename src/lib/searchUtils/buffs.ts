import type { FactionId, SingleItem, SingleItemTypeName } from '@/data/types';
import allBuffDetailedDescriptionsRaw from '@/features/buffs/data/allBuffDetailedDescriptions.json';
import { buffMappingTable } from '@/features/buffs/data/buffMappingTable';
import { buffs } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
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

export async function searchBuffs(query: SearchQuery): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const buff of Object.values(buffs)) {
    const match = await query.matchFields([
      ...commonSearchFields({
        ...buff,
        aliases: buff.aliases?.filter((alias) => !alias.startsWith('#') && !alias.startsWith('%')),
      }),
      [buff.stack, 0.6, 0.55],
      [buff.detailedStack, 0.5, 0.45],
      [buff.sourceDescription, 0.4, 0.35],
    ]);
    if (match) results.push({ type: 'buff', name: buff.name, imageUrl: buff.imageUrl, ...match });
  }
  return results;
}

export async function searchDetailedBuffs(query: SearchQuery): Promise<SearchResult[]> {
  const { lowerCaseQuery, pinyinQuery, findMatchContext } = query;
  const results: SearchResult[] = [];
  const shouldSearchPinyin = /^[a-z]+$/.test(pinyinQuery);

  for (const buff of detailedBuffs) {
    let matchContext: string | undefined;
    let priority = -1;
    let isPinyinMatch = false;

    const nameLowerCase = buff.name.toLowerCase();
    if (nameLowerCase === lowerCaseQuery) {
      matchContext = buff.name;
      priority = -0.9;
    } else if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = buff.name;
      priority = -0.91;
    } else if (shouldSearchPinyin) {
      const namePinyin = await convertToPinyin(buff.name);
      if (namePinyin === pinyinQuery) {
        matchContext = buff.name;
        priority = -0.92;
        isPinyinMatch = true;
      } else if (namePinyin.includes(pinyinQuery)) {
        matchContext = buff.name;
        priority = -0.93;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && buff.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([buff.description]);
      priority = -1.1;
    }

    if (matchContext) {
      results.push({
        type: 'buff',
        name: buff.name,
        matchContext,
        priority,
        isPinyinMatch,
        detailedBuffId: buff.buffId,
        ...(buff.href ? { href: `${buff.href.split('#')[0]}#buff-${buff.buffId}` } : {}),
      });
    }
  }
  return results;
}
