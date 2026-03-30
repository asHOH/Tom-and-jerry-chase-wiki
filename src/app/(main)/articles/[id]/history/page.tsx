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
  return <ArticleHistoryClient />;
}
