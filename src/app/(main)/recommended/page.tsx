import { Metadata } from 'next';

import RecommendedPageClient from './RecommendedPageClient';

export const metadata: Metadata = {
  title: '阵容推荐 - 猫鼠wiki',
  description: '根据对手选择的老鼠阵容，推荐最佳的猫角色。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RecommendedPage() {
  return <RecommendedPageClient />;
}
