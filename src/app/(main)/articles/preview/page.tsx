import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';

import PreviewClient from './PreviewClient';

export const metadata: Metadata = generatePageMetadata({
  title: '文章预览 - 猫鼠wiki',
  description: '预览猫和老鼠手游文章',
  keywords: ['预览', '文章', '猫和老鼠', '手游'],
  canonicalUrl: 'https://tjwiki.com/articles/preview',
});

export default function PreviewPage() {
  return <PreviewClient />;
}
