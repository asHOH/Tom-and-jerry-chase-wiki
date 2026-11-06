import Button from '@/components/ui/Button';

import type { useCommentPages } from './useCommentPages';

export function CommentPageButton({ pages }: { pages: ReturnType<typeof useCommentPages> }) {
  if (!pages.hasMore && !pages.error) return null;
  return (
    <div className='mt-4 text-center'>
      {pages.error && pages.hasData && (
        <p role='status' className='text-muted-foreground mb-2 text-sm'>
          评论加载失败。
        </p>
      )}
      <Button
        variant='secondary'
        loading={pages.isValidating}
        onClick={() => void (pages.error ? pages.mutate() : pages.loadMore())}
      >
        {pages.error ? '重试' : '加载更多评论'}
      </Button>
    </div>
  );
}
