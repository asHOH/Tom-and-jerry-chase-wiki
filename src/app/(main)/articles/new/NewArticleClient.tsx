'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import type { ArticleCharacterOption } from '@/lib/articles/articleCharacterOptions';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { fetchJson } from '@/lib/fetchJson';
import { useUser } from '@/hooks/useUser';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import ArticleSubmissionRecovery from '@/features/articles/components/ArticleSubmissionRecovery';
import { useArticleAuthoring } from '@/features/articles/hooks/useArticleAuthoring';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import ArticleForm, { CategoryOption } from '@/components/articles/ArticleForm';
import { ChevronRightSolidIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

type Category = CategoryOption;

type NewArticleClientProps = {
  characterOptions: readonly ArticleCharacterOption[];
};

const NewArticleClient: React.FC<NewArticleClientProps> = ({ characterOptions }) => {
  const router = useRouter();
  const { isLoading: isUserLoading, isValidating: isUserValidating } = useUser();
  const permissions = usePermissions();
  const canCreateArticle = permissions.has('article.create');
  const { data: categoriesData, error: categoriesError } = useSWR<{ categories: Category[] }>(
    canCreateArticle ? '/api/categories' : null,
    fetchJson
  );
  const categories: Category[] =
    categoriesData?.categories.filter(
      (category) =>
        category.name != '根分类' &&
        permissions.can('article.create', {
          resourceType: 'categories',
          resourceId: category.id,
        })
    ) || [];
  const isLoadingCategories = !categoriesData && !categoriesError;

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
  } = useArticleAuthoring({ kind: 'create', categories, isLoadingCategories });

  useEffect(() => {
    if (!canCreateArticle && !isUserLoading && !isUserValidating) {
      router.push('/articles');
    }
  }, [canCreateArticle, isUserLoading, isUserValidating, router]);

  const handleCancel = () => {
    router.push('/articles');
  };

  // Loading state for user authentication
  if (isUserLoading || (isUserValidating && !canCreateArticle)) {
    return (
      <PageShell width='narrow' className='space-y-8 dark:text-slate-200'>
        <div className='flex min-h-100 items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </PageShell>
    );
  }

  // Redirect if user doesn't have permission
  if (!canCreateArticle) {
    return null;
  }

  return (
    <PageShell width='narrow' className='space-y-8 dark:text-slate-200'>
      {/* Header */}
      <PageHeader title='创建新文章' description='分享你的游戏心得和攻略技巧' className='mb-8'>
        {/* Navigation Breadcrumb */}
        <div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
          <Link
            href='/articles'
            className='transition-colors hover:text-blue-600 dark:hover:text-blue-400'
          >
            文章列表
          </Link>
          <ChevronRightSolidIcon className='size-4' />
          <span className='text-gray-900 dark:text-gray-100'>创建新文章</span>
        </div>
      </PageHeader>

      <ArticleSubmissionRecovery
        recovery={recovery}
        busy={isSubmitting}
        onRetry={recoverSubmission}
        onRelease={releaseSubmission}
      />

      {/* Main Content */}
      <ArticleForm
        characterOptions={characterOptions}
        title={draft.title}
        onTitleChange={(value) => updateDraft({ title: value })}
        category={draft.category}
        onCategoryChange={(value) => updateDraft({ category: value })}
        content={draft.content}
        onContentChange={(value, origin) => updateDraft({ content: value }, origin)}
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        isSubmitting={isSubmitting}
        onSave={submit}
        onCancel={handleCancel}
        submitLabel='提交文章'
        submittingLabel='提交中...'
        errorMessage={error || categoriesError?.message || null}
        contentPlaceholder={ARTICLE_EDITOR_PLACEHOLDER}
        showCharacterSelector={showCharacterSelector}
        characterId={draft.characterId}
        onCharacterChange={(value) => updateDraft({ characterId: value })}
      />
    </PageShell>
  );
};

export default NewArticleClient;
