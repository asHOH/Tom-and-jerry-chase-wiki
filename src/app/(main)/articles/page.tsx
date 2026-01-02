import { Metadata } from 'next';

import { getArticlesPageData } from '@/lib/articles/serverQueries';
import { generatePageMetadata } from '@/lib/metadataUtils';
import ArticlesClient from '@/features/articles/components/ArticlesClient';

export const revalidate = 60;

const DESCRIPTION = '浏览其他爱好者的记录、思考和发现';

export const metadata: Metadata = generatePageMetadata({
  title: '文章列表',
  description: DESCRIPTION,
  keywords: ['文章', '攻略', '猫和老鼠', '手游'],
  canonicalUrl: 'https://tjwiki.com/articles',
});

export default async function ArticlesPage() {
  return <ArticlesClient articles={await getArticlesPageData()} description={DESCRIPTION} />;
}
