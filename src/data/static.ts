import { GameDataManager } from '@/lib/dataManager';
import catAchievementsWithImages from '@/features/achievements/data/catAchievements';
import mouseAchievementsWithImages from '@/features/achievements/data/mouseAchievements';
import catSpecialSkillsWithImages from '@/features/special-skills/data/catSpecialSkills';
import mouseSpecialSkillsWithImages from '@/features/special-skills/data/mouseSpecialSkills';

export const { factionData, cardData } = GameDataManager.getRawData();

export const characters = GameDataManager.getCharacters();

export const cards = GameDataManager.getCards();

export const specialSkills = {
  cat: catSpecialSkillsWithImages,
  mouse: mouseSpecialSkillsWithImages,
};

export const achievements = {
  cat: catAchievementsWithImages,
  mouse: mouseAchievementsWithImages,
};

export { default as items } from '@/features/items/data/items';

export { default as entities } from '@/features/entities/data/entities';

export { default as buffs } from '@/features/buffs/data/buffs';

export { default as itemGroups } from '@/features/items/data/itemGroups';

export { default as maps } from './maps';

export { default as fixtures } from '@/features/fixtures/data/fixtures';

export { default as modes } from '@/features/modes/data/modes';
