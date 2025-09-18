import { ItemGroupDefinition, SingleItem, FactionId } from '@/data/types';
import { buffs, cards, characters, entities, items, specialSkills } from '@/data';

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

export const getItemGroupImageUrl = (group: ItemGroupDefinition): string => {
  if (!!group.specialImageUrl) return group.specialImageUrl;

  const firstItem = group.group[0] ? group.group[0] : { name: '', type: 'character' as const };
  return getSingleItemImageUrl(firstItem) || '/images/icons/cat faction.png';
};
