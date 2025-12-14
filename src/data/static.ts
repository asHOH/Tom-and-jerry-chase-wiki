import { GameDataManager } from '@/lib/dataManager';
import catSpecialSkillsWithImages from '@/features/special-skills/data/catSpecialSkills';
import mouseSpecialSkillsWithImages from '@/features/special-skills/data/mouseSpecialSkills';

import catEntitiesWithImages from './catEntities';
import mouseEntitiesWithImages from './mouseEntities';

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

export const cards = GameDataManager.getCards();

export const specialSkills = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};

export { default as items } from '@/features/items/data/items';

export const entities = {
  cat: catEntitiesWithImages,
  mouse: mouseEntitiesWithImages,
};

export { default as buffs } from './buffs';

export { default as itemGroups } from '@/features/items/data/itemGroups';
