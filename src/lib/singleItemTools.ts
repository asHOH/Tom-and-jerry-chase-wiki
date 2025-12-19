import { FactionId, SingleItem } from '@/data/types';
import getEntityFactionId from '@/features/entities/lib/getEntityFactionId';
import { buffs, cards, characters, entities, items, specialSkills } from '@/data';

export const getSingleItemHref = (singleItem: SingleItem): string => {
  let R: string | undefined;
  if (singleItem.type == 'character') {
    R = `/characters/${singleItem.name}`;
  } else if (singleItem.type == 'knowledgeCard') {
    R = `/cards/${singleItem.name}`;
  } else if (singleItem.type == 'specialSkill') {
    const allSpecialSkills = { ...specialSkills.cat, ...specialSkills.mouse };
    const factionId = singleItem.factionId
      ? singleItem.factionId
      : Object.values(allSpecialSkills).find((skill) => skill.name == singleItem.name)?.factionId;
    R = `/special-skills/${factionId}/${singleItem.name}`;
  } else if (singleItem.type == 'item') {
    R = `/items/${singleItem.name}`;
  } else if (singleItem.type == 'entity') {
    R = `/entities/${singleItem.name}`;
  } else if (singleItem.type == 'buff') {
    R = `/buffs/${singleItem.name}`;
  } else if (singleItem.type == 'skill') {
    const skill = Object.values(characters)
      .flatMap((c) => c.skills)
      .find((skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name));
    if (skill) {
      // Skill in processed characters should have id like `${ownerId}-...`
      const id = (skill as { id?: string }).id;
      const ownerId = id ? id.split('-')[0] : undefined;

      R = `/characters/${ownerId}`;
    }
  }

  return R || '/error';
};

export const getSingleItemImageUrl = (singleItem: SingleItem): string => {
  let R: string | undefined;
  if (singleItem.type == 'character') {
    R = characters[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'knowledgeCard') {
    R = cards[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'specialSkill') {
    if (['应急治疗', '急速翻滚'].includes(singleItem.name)) {
      const factionId: FactionId = singleItem.factionId || 'mouse';
      R = `/images/${factionId}SpecialSkills/${singleItem.name}.png`;
    } else {
      const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
      R = allSpecialSkills.find((specialSkill) => specialSkill.name === singleItem.name)?.imageUrl;
    }
  } else if (singleItem.type == 'item') {
    R = items[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'entity') {
    const allEntities = { ...entities.cat, ...entities.mouse };
    R = allEntities[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'buff') {
    R = buffs[singleItem.name]?.imageUrl;
  } else if (singleItem.type == 'skill') {
    const skill = Object.values(characters)
      .flatMap((c) => c.skills)
      .find((skill) => skill.name === singleItem.name || skill.aliases?.includes(singleItem.name));
    R = skill?.imageUrl;
  }

  return R || '/images/icons/cat faction.png';
};

export const getSingleItemFactionId = (singleItem: SingleItem): FactionId | undefined => {
  const findFactionId = (singleItem: SingleItem): FactionId | undefined => {
    if (singleItem.factionId !== undefined) {
      return singleItem.factionId;
    } else if (singleItem.type === 'character') {
      return characters[singleItem.name]?.factionId;
    } else if (singleItem.type === 'knowledgeCard') {
      return cards[singleItem.name]?.factionId;
    } else if (singleItem.type == 'specialSkill') {
      {
        const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
        return allSpecialSkills.find((specialSkill) => specialSkill.name === singleItem.name)
          ?.factionId;
      }
    } else if (singleItem.type === 'item') {
      return items[singleItem.name]?.factionId;
    } else if (singleItem.type == 'skill') {
      const owner = Object.values(characters).find((c) =>
        c.skills.some((skill) => skill.name === singleItem.name)
      );
      return owner?.factionId;
    }
    return undefined;
  };
  const findEntity = (singleItem: SingleItem) => {
    const allEntities = { ...entities.cat, ...entities.mouse };
    return allEntities[singleItem.name];
  };
  if (singleItem.type !== 'entity') {
    return findFactionId(singleItem);
  } else {
    const entity = findEntity(singleItem);
    return entity !== undefined ? getEntityFactionId(entity) : undefined;
  }
};
