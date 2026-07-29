import { Metadata } from 'next';

import { selectArticleCharacterOptions } from '@/lib/articles/articleCharacterOptions';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import EditArticleClient from './EditArticleClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return generatePageMetadata({
    title: '编辑文章',
    description: '编辑已发布的文章',
    canonicalUrl: getCanonicalUrl(`/articles/${id}/edit`),
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function EditArticlePage() {
  const characters = await getPublishedDomainReadModel('characters');

  return <EditArticleClient characterOptions={selectArticleCharacterOptions(characters.data)} />;
}
