import { Metadata } from 'next';

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

export default function EditArticlePage() {
  return <EditArticleClient />;
}
