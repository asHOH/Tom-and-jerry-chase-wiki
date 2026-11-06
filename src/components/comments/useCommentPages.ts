'use client';

import { useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';

import type { ApiComment } from '@/lib/comments/types';
import { fetchJson } from '@/lib/fetchJson';

type CommentPage = { comments: ApiComment[]; nextCursor: string | null };

export function useCommentPages(scope: string, targetId: string) {
  const { data, error, mutate, setSize, isLoading, isValidating } = useSWRInfinite<CommentPage>(
    (index, previous: CommentPage | null) => {
      if (!targetId || (index > 0 && !previous?.nextCursor)) return null;
      const params = new URLSearchParams({ scope, targetId });
      if (previous?.nextCursor) params.set('cursor', previous.nextCursor);
      return `/api/comments?${params}`;
    },
    fetchJson,
    // Recheck restored pages on reopen without rereading the entire thread on each load-more.
    { revalidateOnMount: true }
  );

  const byParent = useMemo(() => {
    const index = new Map<string | null, ApiComment[]>();
    for (const page of data ?? []) {
      for (const comment of page.comments) {
        const siblings = index.get(comment.parent_id);
        if (siblings) siblings.push(comment);
        else index.set(comment.parent_id, [comment]);
      }
    }
    return index;
  }, [data]);

  return {
    byParent,
    count: data?.reduce((sum, page) => sum + page.comments.length, 0) ?? 0,
    hasMore: Boolean(data?.at(-1)?.nextCursor),
    hasData: Boolean(data),
    loadMore: () => setSize((data?.length ?? 0) + 1),
    error,
    mutate,
    isLoading,
    isValidating,
  };
}
