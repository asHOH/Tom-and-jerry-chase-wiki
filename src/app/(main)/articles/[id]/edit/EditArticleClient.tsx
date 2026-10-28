'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';

import type { ArticleCharacterOption } from '@/lib/articles/articleCharacterOptions';
import type { ArticleEditInfoResponse } from '@/lib/articles/editSources';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { formatArticleDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { fetchJson } from '@/lib/fetchJson';
import { useUser } from '@/hooks/useUser';
import ArticleConflictNotice from '@/features/articles/components/ArticleConflictNotice';
import ArticleSubmissionRecovery from '@/features/articles/components/ArticleSubmissionRecovery';
import { useArticleAuthoring } from '@/features/articles/hooks/useArticleAuthoring';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import ArticleForm, { CategoryOption } from '@/components/articles/ArticleForm';
import { ChevronRightSolidIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

type Category = CategoryOption;

type EditArticleClientProps = {
  characterOptions: readonly ArticleCharacterOption[];
};

const EditArticleClient: React.FC<EditArticleClientProps> = ({ characterOptions }) => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLoading: isUserLoading, isValidating: isUserValidating } = useUser();
  const permissions = usePermissions();
  const canEditArticle =
    permissions.has('article.update_own') || permissions.has('article.update_any');
  const { data: categoriesData, error: categoriesError } = useSWR<{ categories: Category[] }>(
    canEditArticle ? '/api/categories' : null,
    fetchJson
  );
  const categories: Category[] = categoriesData?.categories || [];
  const isLoadingCategories = !categoriesData && !categoriesError;

  const { data: articleData, error: articleError } = useSWR<ArticleEditInfoResponse>(
    id && canEditArticle ? `/api/articles/${id}/info` : null,
    fetchJson
  );

  const {
    recovery,
    recoverSubmission,
    releaseSubmission,
    draft,
    updateDraft,
    submit,
    isSubmitting,
    error,
    showCharacterSelector,
    selectedSource,
    selectSource,
    sourceChange,
    resolveSourceChange,
    needsReconciliation,
    reconciliation,
    loadReconciliation,
    confirmReconciliation,
  } = useArticleAuthoring({
    kind: 'edit',
    articleId: id,
    info: articleData,
    categories,
    isLoadingCategories,
  });

  useEffect(() => {
    if (!canEditArticle && !isUserLoading && !isUserValidating) {
      router.push('/articles');
    }
  }, [canEditArticle, isUserLoading, isUserValidating, router]);

  const handleCancel = () => {
    router.push(`/articles/${id}`);
  };

  const isArticleLoading = !!id && !articleData && !articleError;
  const isLoading = isArticleLoading || isUserLoading || (isUserValidating && !canEditArticle);

  // Loading state for user authentication and article data
  if (isLoading) {
    return (
      <PageShell width='narrow' className='space-y-8 dark:text-slate-200'>
        <div className='flex min-h-100 items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </PageShell>
    );
  }

  // Redirect if user doesn't have permission
  if (!canEditArticle) {
    return null;
  }

  const showSourcePicker = Boolean(
    articleData?.policy.show_source_picker &&
    articleData.edit_sources.approved &&
    articleData.edit_sources.pending_mine
  );

  const submitNoticeMessage = articleData?.policy.will_override_pending
    ? '您当前已有待审核版本。本次提交将覆盖旧版本。'
    : null;

  const approvedSource = articleData?.edit_sources.approved;
  const pendingSource = articleData?.edit_sources.pending_mine;

  return (
    <PageShell width='narrow' className='space-y-8 dark:text-slate-200'>
      {/* Header */}
      <PageHeader title='编辑文章' description='修改和完善您的文章内容' className='mb-8'>
        {/* Navigation Breadcrumb */}
        <div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
          <Link
            href='/articles'
            className='transition-colors hover:text-blue-600 dark:hover:text-blue-400'
          >
            文章列表
          </Link>
          <ChevronRightSolidIcon className='size-4' />
          <Link
            href={`/articles/${id}`}
            className='transition-colors hover:text-blue-600 dark:hover:text-blue-400'
          >
            文章详情
          </Link>
          <ChevronRightSolidIcon className='size-4' />
          <span className='text-gray-900 dark:text-gray-100'>编辑文章</span>
        </div>
      </PageHeader>

      {showSourcePicker && approvedSource && pendingSource && (
        <div className='mx-auto max-w-4xl px-4'>
          <Notice variant='warning' className='space-y-4 p-4'>
            <div>
              <p className='text-sm font-semibold'>检测到您有更新的待审核版本</p>
              <p className='mt-1 text-xs'>请选择编辑起点。</p>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <Button
                variant='unstyled'
                type='button'
                disabled={isSubmitting}
                onClick={() => selectSource('approved')}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedSource === 'approved'
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                    : 'border-border bg-surface-sunken hover:border-blue-400 dark:hover:border-blue-400'
                )}
              >
                <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  公开版本
                </div>
                <div className='text-muted-foreground mt-1 text-xs'>
                  更新时间: {formatArticleDate(approvedSource.created_at)}
                </div>
              </Button>

              <Button
                variant='unstyled'
                type='button'
                disabled={isSubmitting}
                onClick={() => selectSource('pending_mine')}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedSource === 'pending_mine'
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                    : 'border-border bg-surface-sunken hover:border-blue-400 dark:hover:border-blue-400'
                )}
              >
                <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  我的待审核版本
                </div>
                <div className='text-muted-foreground mt-1 text-xs'>
                  提交时间: {formatArticleDate(pendingSource.created_at)}
                </div>
                {pendingSource.commit_message && (
                  <div className='text-muted-foreground mt-1 line-clamp-1 text-xs'>
                    提交说明: {pendingSource.commit_message}
                  </div>
                )}
              </Button>
            </div>
          </Notice>
        </div>
      )}

      <BaseDialog
        open={sourceChange !== null}
        onOpenChange={(open) => {
          if (!open) resolveSourceChange(false);
        }}
        ariaLabel='切换编辑起点'
        size='sm'
      >
        <div className='space-y-4 p-5'>
          <h2 className='text-lg font-semibold'>切换编辑起点</h2>
          <p>当前有未提交的修改。切换将替换这些修改及提交说明。</p>
          <div className='flex justify-end gap-3'>
            <Button variant='secondary' onClick={() => resolveSourceChange(false)}>
              继续编辑
            </Button>
            <Button onClick={() => resolveSourceChange(true)}>放弃修改并切换</Button>
          </div>
        </div>
      </BaseDialog>

      <ArticleSubmissionRecovery
        recovery={recovery}
        busy={isSubmitting}
        onRetry={recoverSubmission}
        onRelease={releaseSubmission}
      />

      {/* Main Content */}
      {needsReconciliation && (
        <ArticleConflictNotice
          snapshot={reconciliation}
          categories={categories}
          busy={isSubmitting || recovery?.status === 'pending'}
          onLoad={loadReconciliation}
          onConfirm={confirmReconciliation}
        />
      )}
      <ArticleForm
        characterOptions={characterOptions}
        title={draft.title}
        onTitleChange={(value) => updateDraft({ title: value })}
        category={draft.category}
        onCategoryChange={(value) => updateDraft({ category: value })}
        content={draft.content}
        onContentChange={(value, origin) => updateDraft({ content: value }, origin)}
        categories={categories.filter((cat) => cat.name != '根分类')}
        isLoadingCategories={isLoadingCategories}
        isSubmitting={isSubmitting}
        onSave={submit}
        onCancel={handleCancel}
        submitLabel='更新文章'
        submittingLabel='更新中...'
        errorMessage={error || articleError?.message || categoriesError?.message || null}
        showCharacterSelector={showCharacterSelector}
        characterId={draft.characterId}
        onCharacterChange={(value) => updateDraft({ characterId: value })}
        commitMessage={draft.commitMessage}
        onCommitMessageChange={(value) => updateDraft({ commitMessage: value })}
        showCommitMessage={true}
        submitNoticeMessage={submitNoticeMessage}
      />
    </PageShell>
  );
};

export default EditArticleClient;
