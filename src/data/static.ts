import { GameDataManager } from '@/lib/dataManager';

import catEntitiesWithImages from './catEntities';
import catSpecialSkillsWithImages from './catSpecialSkills';
import mouseEntitiesWithImages from './mouseEntities';
import mouseSpecialSkillsWithImages from './mouseSpecialSkills';

export const { factionData, characterData, cardData } = GameDataManager.getRawData();

export const cards = GameDataManager.getCards();

export const specialSkills = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};

export { default as items } from './items';

export const entities = {
  cat: catEntitiesWithImages,
  mouse: mouseEntitiesWithImages,
};

export { default as buffs } from './buffs';

export { default as itemGroups } from './itemGroups';
