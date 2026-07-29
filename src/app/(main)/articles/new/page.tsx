import { Metadata } from 'next';

import { selectArticleCharacterOptions } from '@/lib/articles/articleCharacterOptions';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';

import NewArticleClient from './NewArticleClient';

export const metadata: Metadata = generatePageMetadata({
  title: '创建新文章',
  description: '创建新的猫和老鼠手游文章',
  keywords: ['新文章', '创建', '猫和老鼠', '手游'],
  canonicalUrl: getCanonicalUrl('/articles/new'),
  robots: { index: false },
});

export default async function NewArticlePage() {
  const characters = await getPublishedDomainReadModel('characters');

  return <NewArticleClient characterOptions={selectArticleCharacterOptions(characters.data)} />;
}
