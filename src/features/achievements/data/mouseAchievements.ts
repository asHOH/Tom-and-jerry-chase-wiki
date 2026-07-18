import type { Achievement, AchievementDefinition } from '@/data/types';

const getAchievementImageUrl = (name: string): string =>
  `/images/achievements/${encodeURIComponent(name)}.png`;

const mouseAchievementDefinitions: Record<string, AchievementDefinition> = {
  鼠皇: { score: 400, description: '击中猫10次' },
  鼠圣: { score: 400, description: '火箭上救下队友5次及以上' },
  机智: { score: 200, description: '获得胜利或成功逃脱' },
  翻盘: { score: 200, description: '老鼠剩余2只进入逃脱期并最终逃跑' },
  可靠: { score: 200, description: '火箭上救队友3次' },
  贪吃: { score: 200, description: '参与塞入3个奶酪' },
  墙鼠: { score: 100, description: '打掉墙缝超过一半的血量' },
  灵活: { score: 100, description: '老鼠没有被猫抓到手里过' },
  大佬: { score: 100, description: '火箭上被救3次' },
  善良: { score: 100, description: '治疗队友3次' },
  欧皇: { score: 100, description: '火箭上挣脱1次' },
  天命: { score: 100, description: '抓住后20秒内挣脱' },
  胆小: { score: 50, description: '隐藏时间30秒' },
  无畏: { score: 50, description: '踩2个老鼠夹' },
  大胃: { score: 50, description: '吃6个食物' },
  '皮！': { score: 50, description: '砸碎道具10个' },
  '坑！': { score: -50, description: '误伤队友5次' },
};

const mouseAchievementsWithImages: Record<string, Achievement> = Object.fromEntries(
  Object.entries(mouseAchievementDefinitions).map(([name, achievement]) => [
    name,
    {
      ...achievement,
      name,
      factionId: 'mouse' as const,
      imageUrl: achievement.specialImageUrl ?? getAchievementImageUrl(name),
    },
  ])
);

export function createMouseAchievementsData(): Record<string, Achievement> {
  return structuredClone(mouseAchievementsWithImages);
}

export default createMouseAchievementsData();
