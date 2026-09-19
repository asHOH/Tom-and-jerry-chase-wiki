'use client';

import { useSWRConfig } from 'swr';

/** SWR persists across document navigations; clear affected entries before leaving the page. */
export function useClearArticleClientCache() {
  const { mutate } = useSWRConfig();
  return async (articleId: string | undefined): Promise<string | null> => {
    try {
      await mutate(
        (key) =>
          typeof key === 'string' &&
          (key === '/api/articles/pending' ||
            key === '/api/moderation/pending' ||
            key === `/api/articles/${articleId}/history` ||
            key === `/api/articles/${articleId}/info` ||
            key.startsWith('/api/articles/preview?')),
        undefined,
        { revalidate: false }
      );
      return null;
    } catch (error) {
      console.error('Browser cache refresh failed after article mutation:', error);
      return '操作已成功，但页面数据刷新失败。请刷新页面查看最新状态，请勿重复提交。';
    }
  };
}
