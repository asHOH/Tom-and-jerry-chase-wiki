import { Achievement, AchievementDefinition } from './types';

const getAchievementImageUrl = (name: string, specialImageUrl: string | undefined): string => {
  if (specialImageUrl) return specialImageUrl;
  return `/images/achievements/${encodeURIComponent(name)}.png`;
};

const achievementDefinitions: Record<string, AchievementDefinition> = {};

const achievementsWithImages: Record<string, Achievement> = Object.fromEntries(
  (Object.entries(achievementDefinitions) as Array<[string, AchievementDefinition]>).map(
    ([name, definition]) => [
      name,
      {
        ...definition,
        name,
        imageUrl: getAchievementImageUrl(name, definition.specialImageUrl),
      },
    ]
  )
);

export default achievementsWithImages;
