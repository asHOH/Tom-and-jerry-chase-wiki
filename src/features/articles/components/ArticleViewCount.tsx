'use client';

import useSWR from 'swr';

import { EyeIcon } from '@/components/icons/CommonIcons';

async function fetchViewCount(url: string): Promise<{ viewCount: number }> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Article views request failed (${response.status})`);
  return response.json();
}

export default function ArticleViewCount({ articleId }: { articleId: string }) {
  const { data } = useSWR(`/api/articles/${encodeURIComponent(articleId)}/views/`, fetchViewCount, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  if (data?.viewCount == null) return null;

  return (
    <div className='flex items-center gap-2'>
      <EyeIcon className='size-4' strokeWidth={1.5} />
      <span>浏览: {data.viewCount}</span>
    </div>
  );
}
