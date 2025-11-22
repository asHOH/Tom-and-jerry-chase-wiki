import NewArticleClient from './NewArticleClient';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: '创建新文章 - 猫鼠wiki',
    description: '创建新的猫和老鼠手游文章',
    keywords: ['新文章', '创建', '猫和老鼠', '手游'],
    canonicalUrl: 'https://tjwiki.com/articles/new',
  }),
  robots: { index: false },
};

export default function NewArticlePage() {
  return <NewArticleClient />;
}
