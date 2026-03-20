import { GameDataManager } from '@/lib/dataManager';
import catSpecialSkillsWithImages from '@/features/special-skills/data/catSpecialSkills';
import mouseSpecialSkillsWithImages from '@/features/special-skills/data/mouseSpecialSkills';

export const { factionData, cardData } = GameDataManager.getRawData();

export const cards = GameDataManager.getCards();

export const specialSkills = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};

export { default as items } from '@/features/items/data/items';

export { default as entities } from '@/features/entities/data/entities';

export { default as buffs } from '@/features/buffs/data/buffs';

export { default as itemGroups } from '@/features/items/data/itemGroups';

export { default as maps } from './maps';

export { default as fixtures } from '@/features/fixtures/data/fixtures';

export { default as modes } from '@/features/modes/data/modes';

export { default as achievements } from './achievements';
