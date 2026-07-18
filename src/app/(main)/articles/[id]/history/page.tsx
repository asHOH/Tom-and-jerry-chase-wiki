import { Suspense } from 'react';
import { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import ArticleHistoryClient from './ArticleHistoryClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return generatePageMetadata({
    title: '文章历史',
    description: '查看已发布文章的历史版本',
    canonicalUrl: getCanonicalUrl(`/articles/${id}/history`),
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default function ArticleHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className='container mx-auto px-4 py-16 text-center text-gray-600 dark:text-gray-400'>
          正在加载版本历史...
        </div>
      }
    >
      <ArticleHistoryClient />
    </Suspense>
  );
}
