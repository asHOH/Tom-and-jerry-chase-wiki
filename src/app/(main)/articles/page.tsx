import { Metadata } from 'next';

import { getArticlesPageData } from '@/lib/articles/serverQueries';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import ArticlesClient from '@/features/articles/components/ArticlesClient';

const REVALIDATE_SECONDS = process.env.VERCEL ? 1800 : 120;
export const revalidate = REVALIDATE_SECONDS;

const DESCRIPTION = '浏览其他爱好者的记录、思考和发现';

export const metadata: Metadata = generatePageMetadata({
  title: '文章列表',
  description: DESCRIPTION,
  keywords: ['文章', '攻略', '猫和老鼠', '手游'],
  canonicalUrl: getCanonicalUrl('/articles'),
});

export default async function ArticlesPage() {
  return <ArticlesClient articles={await getArticlesPageData()} description={DESCRIPTION} />;
}
