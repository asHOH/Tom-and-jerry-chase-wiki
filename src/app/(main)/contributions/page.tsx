import { Suspense } from 'react';
import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import ContributionsClient from './ContributionsClient';

export const metadata: Metadata = generatePageMetadata({
  title: '我的贡献',
  description: '查看文章与游戏数据提交的审核状态和反馈',
  canonicalUrl: getCanonicalUrl('/contributions'),
  robots: { index: false },
});

export default function ContributionsPage() {
  return (
    <Suspense fallback={<div className='py-12 text-center text-slate-500'>正在加载贡献记录…</div>}>
      <ContributionsClient />
    </Suspense>
  );
}
