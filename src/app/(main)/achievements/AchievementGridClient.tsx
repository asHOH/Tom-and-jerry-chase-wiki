'use client';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import AchievementGrid from '@/features/achievements/achievement-grid/AchievementGrid';

export default function AchievementGridClient({
  data,
  publishedRevision,
}: {
  data: PublishedGameDataByType['achievements'];
  publishedRevision: `v1:${string}`;
}) {
  return <AchievementGrid data={data} publishedRevision={publishedRevision} />;
}
