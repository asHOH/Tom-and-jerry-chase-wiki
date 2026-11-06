import { getFactionLabel } from '@/constants/factions';
import type { FactionId, SingleItem, SingleItemOrGroup } from '@/data/types';
import { resolveSpecialSkill } from '@/features/special-skills/resolveSpecialSkill';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

import { resolveItemFaction } from './itemFaction';

export {
  compareSingleItem,
  getSingleItemPrototype,
  getSingleItemVariant,
} from './singleItemIdentity';

const findAchievement = (singleItem: SingleItem) => {
  if (singleItem.factionId) return achievements[singleItem.factionId][singleItem.name];
  return achievements.cat[singleItem.name] ?? achievements.mouse[singleItem.name];
};

export const getSingleItemHref = (singleItem: SingleItemOrGroup): string => {
  let result: string | undefined;

  if (singleItem.type === 'itemGroup') {
    result = `/itemGroups/${singleItem.name}`;
  } else if (singleItem.type === 'character') {
    result = `/characters/${singleItem.name}`;
  } else if (singleItem.type === 'knowledgeCard') {
    result = `/cards/${singleItem.name}`;
  } else if (singleItem.type === 'specialSkill') {
    const skill = resolveSpecialSkill(specialSkills, singleItem.name, singleItem.factionId);
    if (skill) result = `/special-skills/${skill.factionId}/${skill.name}`;
  } else if (singleItem.type === 'item') {
    result = `/items/${singleItem.name}`;
  } else if (singleItem.type === 'entity') {
    result = `/entities/${singleItem.name}`;
  } else if (singleItem.type === 'buff') {
    result = `/buffs/${singleItem.name}`;
  } else if (singleItem.type === 'map') {
    result = `/maps/${singleItem.name}`;
  } else if (singleItem.type === 'fixture') {
    result = `/fixtures/${singleItem.name}`;
  } else if (singleItem.type === 'mode') {
    result = `/modes/${singleItem.name}`;
  } else if (singleItem.type === 'achievement') {
    const factionId = singleItem.factionId ?? findAchievement(singleItem)?.factionId;
    result = `/achievements/${factionId}/${singleItem.name}`;
  } else if (singleItem.type === 'skill') {
    const skill = Object.values(characters)
      .flatMap((character) => character.skills)
      .find(
        (characterSkill) =>
          characterSkill.name === singleItem.name ||
          characterSkill.aliases?.includes(singleItem.name)
      );

    if (skill) {
      const id = (skill as { id?: string }).id;
      const ownerId = id ? id.split('-')[0] : undefined;
      result = `/characters/${ownerId}`;
    }
  }

  return result || '/error';
};

export const getSingleItemImageUrl = (singleItem: SingleItemOrGroup): string => {
  let result: string | undefined;

  if (singleItem.type === 'itemGroup') {
    const itemGroup = itemGroups[singleItem.name];
    if (itemGroup?.specialImageUrl) return itemGroup.specialImageUrl;

    const firstItem = itemGroup?.group[0];
    return firstItem ? getSingleItemImageUrl(firstItem) : '/images/icons/cat-faction.png';
  } else if (singleItem.type === 'character') {
    result = characters[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'knowledgeCard') {
    result = cards[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'specialSkill') {
    result = resolveSpecialSkill(specialSkills, singleItem.name, singleItem.factionId)?.imageUrl;
  } else if (singleItem.type === 'item') {
    result = items[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'entity') {
    result = entities[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'buff') {
    result = buffs[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'map') {
    result = maps[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'fixture') {
    result = fixtures[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'mode') {
    result = modes[singleItem.name]?.imageUrl;
  } else if (singleItem.type === 'achievement') {
    result = findAchievement(singleItem)?.imageUrl;
  } else if (singleItem.type === 'skill') {
    const skill = Object.values(characters)
      .flatMap((character) => character.skills)
      .find(
        (characterSkill) =>
          characterSkill.name === singleItem.name ||
          characterSkill.aliases?.includes(singleItem.name)
      );
    result = skill?.imageUrl;
  }

  return result || '/images/icons/cat-faction.png';
};

const factionCache = new Map<string, FactionId | undefined>();

export const getSingleItemFactionId = (
  singleItem: SingleItem,
  visitedSet = new Set<string>(),
  cache = factionCache
): FactionId | undefined =>
  resolveItemFaction(
    singleItem,
    { characters, cards, entities, achievements, items, specialSkills },
    visitedSet,
    cache
  );

const formatOwnerName = (ownerName: string, ownerFactionId?: FactionId): string => {
  const ownerFactionLabel = getFactionLabel(ownerFactionId);
  return ownerFactionLabel ? `${ownerFactionLabel}‐${ownerName}` : ownerName;
};

export const getOwnerSuffix = (
  ownerName: string | undefined,
  ownerFactionId?: FactionId
): string | undefined => {
  if (!ownerName) return undefined;
  return `（${formatOwnerName(ownerName, ownerFactionId)}）`;
};

export const getSingleItemOwnerSuffix = (singleItem: SingleItem): string | undefined => {
  const formatOwner = (owner: SingleItem): string => {
    return formatOwnerName(owner.name, getSingleItemFactionId(owner));
  };

  if (singleItem.type === 'skill') {
    const owner = Object.values(characters).find((character) =>
      character.skills.some(
        (skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name)
      )
    );

    if (!owner) return undefined;

    return getOwnerSuffix(owner.id, owner.factionId);
  }

  if (singleItem.type === 'entity') {
    const owner = entities[singleItem.name]?.owner;

    if (!owner) return undefined;

    const owners = Array.isArray(owner) ? owner : [owner];
    const formattedOwners = owners.map(formatOwner);

    if (formattedOwners.length === 0) return undefined;

    return `（${formattedOwners.join(' / ')}）`;
  }

  return undefined;
};
