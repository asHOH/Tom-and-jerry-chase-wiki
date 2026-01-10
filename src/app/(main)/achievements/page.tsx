import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import AchievementGridClient from './AchievementGridClient';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '对局成就列表 - 猫和老鼠手游wiki',
  description: '查询猫和老鼠手游的所有对局成就信息。',
  canonicalUrl: getCanonicalUrl('/achievements'),
});

export default function AchievementsPage() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <AchievementGridClient />
    </div>
  );
}
