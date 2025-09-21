import { GameDataManager } from '@/lib/dataManager';
import catSpecialSkillsWithImages from './catSpecialSkills';
import mouseSpecialSkillsWithImages from './mouseSpecialSkills';
import catEntitiesWithImages from './catEntities';
import mouseEntitiesWithImages from './mouseEntities';

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
