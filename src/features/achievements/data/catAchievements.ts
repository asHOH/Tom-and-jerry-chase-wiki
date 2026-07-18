import type { Achievement, AchievementDefinition } from '@/data/types';

const getAchievementImageUrl = (name: string): string =>
  `/images/achievements/${encodeURIComponent(name)}.png`;

const catAchievementDefinitions: Record<string, AchievementDefinition> = {
  四抓: { score: 800, description: '抓住并放飞4只老鼠' },
  极速: { score: 500, description: '5分钟内结束游戏' },
  猫皇: { score: 400, description: '抓住并放飞3只老鼠' },
  狂攻: { score: 200, description: '击倒9次老鼠' },
  凶猛: { score: 200, description: '将老鼠绑上火箭6次' },
  翻盘: { score: 200, description: '猫在逃脱期获得胜利' },
  双抓: { score: 200, description: '抓住并放飞2只老鼠' },
  强势: { score: 100, description: '猫没有被打爆过' },
  精准: { score: 100, description: '猫使用道具砸中老鼠5次' },
  霉运: { score: 100, description: '抓住后20秒内被挣脱' },
  非酋: { score: 100, description: '被老鼠从火箭上挣脱1次' },
  坚守: { score: 100, description: '使用泡泡机或者修理墙缝4次以上' },
  狡诈: { score: 100, description: '隐身状态抓老鼠1次' },
  阴险: { score: 50, description: '设置3个老鼠夹' },
  绝杀: { score: 50, description: '最后60秒获胜' },
  '爱！': { score: 50, description: '游戏结束没有老鼠被放飞也没有老鼠逃脱' },
};

const catAchievementsWithImages: Record<string, Achievement> = Object.fromEntries(
  Object.entries(catAchievementDefinitions).map(([name, achievement]) => [
    name,
    {
      ...achievement,
      name,
      factionId: 'cat' as const,
      imageUrl: achievement.specialImageUrl ?? getAchievementImageUrl(name),
    },
  ])
);

export function createCatAchievementsData(): Record<string, Achievement> {
  return structuredClone(catAchievementsWithImages);
}

export default createCatAchievementsData();
