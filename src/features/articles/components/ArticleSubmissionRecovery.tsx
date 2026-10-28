import { useState } from 'react';
import type { Route } from 'next';

import { getUserSubmissionHref } from '@/lib/users/profileRoutes';
import { useUser } from '@/hooks/useUser';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import Link from '@/components/Link';

export type ArticleRecovery = { status: 'pending' } | { status: 'confirmed'; articleId: string };

export default function ArticleSubmissionRecovery({
  recovery,
  busy,
  onRetry,
  onRelease,
}: {
  recovery: ArticleRecovery | null;
  busy: boolean;
  onRetry: () => void;
  onRelease: () => void;
}) {
  const [confirmRelease, setConfirmRelease] = useState(false);
  const { nickname } = useUser();
  if (!recovery) return null;
  return (
    <Notice variant='warning' className='mx-auto max-w-4xl space-y-3 p-4'>
      {recovery.status === 'pending' ? (
        <>
          <p>上次提交的结果尚未确认。重试原始提交可以确认结果，当前草稿会保留。</p>
          <Button disabled={busy} onClick={onRetry}>
            重试原始提交
          </Button>
          {nickname && (
            <Link
              href={getUserSubmissionHref(nickname) as Route}
              target='_blank'
              rel='noopener noreferrer'
              className='ml-3 underline'
            >
              查看贡献记录
            </Link>
          )}
          <Button
            variant='secondary'
            disabled={busy || !nickname}
            onClick={() => setConfirmRelease(true)}
          >
            核对后解除重试
          </Button>
          <BaseDialog
            open={confirmRelease}
            onOpenChange={setConfirmRelease}
            ariaLabel='解除提交重试'
            size='sm'
          >
            <div className='space-y-4 p-5'>
              <h2 className='text-lg font-semibold'>解除提交重试</h2>
              <p>
                请先核对贡献记录及文章历史，确认原提交失败。若原提交已成功，继续提交可能产生重复文章或版本。当前草稿会保留。
              </p>
              <Button variant='secondary' onClick={() => setConfirmRelease(false)}>
                继续核对
              </Button>
              <Button
                onClick={() => {
                  onRelease();
                  setConfirmRelease(false);
                }}
              >
                已确认原提交失败
              </Button>
            </div>
          </BaseDialog>
        </>
      ) : (
        <>
          <p>
            上次提交已确认，当前草稿仍保留。请将后续修改复制到已提交文章继续编辑；创建另一篇文章时可重新打开创建页面。
          </p>
          <Link
            href={`/articles/${recovery.articleId}/edit/`}
            target='_blank'
            rel='noopener noreferrer'
            className='underline'
          >
            打开已提交文章继续编辑
          </Link>
        </>
      )}
    </Notice>
  );
}
