import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  normalizeArticleListParams,
  type ArticleListSearchParams,
} from '@/lib/articles/listParams';
import { getArticleListPage } from '@/lib/articles/serverQueries';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import type { FactionId } from '@/data/types';
import ArticlesClient from '@/features/articles/components/ArticlesClient';
import PageShell from '@/components/ui/PageShell';

export const revalidate = 60;

const DESCRIPTION = '浏览其他爱好者的记录、思考和发现';

export const metadata: Metadata = generatePageMetadata({
  title: '文章列表',
  description: DESCRIPTION,
  keywords: ['文章', '攻略', '猫和老鼠', '手游'],
  canonicalUrl: getCanonicalUrl('/articles'),
});

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<ArticleListSearchParams>;
}) {
  const listParams = normalizeArticleListParams(await searchParams);
  const [articles, characters] = await Promise.all([
    getArticleListPage(listParams),
    getPublishedDomainReadModel('characters'),
  ]);

  if (listParams.page > Math.max(1, articles.total_pages)) {
    notFound();
  }

  const boundCharacterIds = new Set(
    articles.articles
      .map((article) => article.character_id)
      .filter((id): id is string => typeof id === 'string')
  );
  const characterSummaries = Object.fromEntries(
    [...boundCharacterIds].flatMap((id) => {
      const character = characters.data[id];
      return character ? [[id, { id: character.id, factionId: character.factionId }]] : [];
    })
  ) as Record<string, { id: string; factionId?: FactionId }>;

  return (
    <PageShell width='wide'>
      <ArticlesClient
        articles={articles}
        listParams={listParams}
        characterSummaries={characterSummaries}
        description={DESCRIPTION}
      />
    </PageShell>
  );
}
