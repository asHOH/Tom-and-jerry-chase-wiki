'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import type { ArticleCharacterOption } from '@/lib/articles/articleCharacterOptions';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { useContributionSubmissionFeedback } from '@/hooks/useContributionSubmissionFeedback';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/context/ToastContext';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import ArticleForm, { CategoryOption } from '@/components/articles/ArticleForm';
import Link from '@/components/Link';

type Category = CategoryOption;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & {
      info?: unknown;
      status?: number;
    };
    // Attach extra info to the error object.
    try {
      error.info = await res.json();
    } catch {
      error.info = { status: res.status };
    }
    error.status = res.status;
    throw error;
  }
  return res.json();
};

type NewArticleClientProps = {
  characterOptions: readonly ArticleCharacterOption[];
};

const NewArticleClient: React.FC<NewArticleClientProps> = ({ characterOptions }) => {
  const router = useRouter();
  const { isLoading: isUserLoading, isValidating: isUserValidating } = useUser();
  const permissions = usePermissions();
  const canCreateArticle = permissions.has('article.create');
  const { error: showError } = useToast();
  const showSubmissionFeedback = useContributionSubmissionFeedback();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categoriesData, error: categoriesError } = useSWR<{ categories: Category[] }>(
    canCreateArticle ? '/api/categories' : null,
    fetcher
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

  // Check if selected category is "角色攻略" (game strategy) - requires character binding
  const isGameStrategyCategory = (categoryId: string): boolean => {
    if (!categoryId || categories.length === 0) return false;
    const selectedCat = categories.find((c) => c.id === categoryId);
    return selectedCat?.name === '角色攻略';
  };

  const showCharacterSelector = isGameStrategyCategory(category);

  const isContentEmpty = (html: string) => {
    if (!html) return true;
    const stripped = html
      .replace(/<br\s*\/?>(?=\s*<\/p>|\s*$)/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|\s+/g, '')
      .trim();
    if (stripped.length === 0) return true;
    return stripped === ARTICLE_EDITOR_PLACEHOLDER.replace(/\s+/g, '');
  };

  useEffect(() => {
    if (!canCreateArticle && !isUserLoading && !isUserValidating) {
      router.push('/articles');
    }
  }, [canCreateArticle, isUserLoading, isUserValidating, router]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Clear character selection if switching away from game strategy category
    if (!isGameStrategyCategory(newCategory)) {
      setCharacterId(null);
    }
  };

  const handleSave = async () => {
    if (isLoadingCategories) {
      return;
    }

    if (categories.length === 0) {
      setError('无法加载分类信息，请刷新页面重试');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === category);
    if (category && !selectedCategory) {
      setError('未能匹配到所选分类，请刷新页面后重试');
      return;
    }

    if (!title.trim()) {
      setError('请输入文章标题');
      return;
    }

    if (!category) {
      setError('请选择文章分类');
      return;
    }

    if (showCharacterSelector && !characterId) {
      setError('角色攻略文章需要选择一个关联角色');
      return;
    }

    if (isContentEmpty(content)) {
      setError('请输入文章内容');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/articles/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content,
          // Only send character_id when required to avoid schema rejection on null
          character_id: showCharacterSelector ? characterId : undefined,
        }),
      });

      if (response.ok) {
        router.push('/articles');
        showSubmissionFeedback('文章提交成功，正在等待审核。');
      } else {
        const errorData = await response.json();
        showError(errorData.message || '提交文章失败');
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      showError('提交文章时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className='flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
          <Link
            href='/articles'
            className='transition-colors hover:text-blue-600 dark:hover:text-blue-400'
          >
            文章列表
          </Link>
          <svg className='size-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
              clipRule='evenodd'
            />
          </svg>
          <span className='text-gray-900 dark:text-gray-100'>创建新文章</span>
        </div>
      </PageHeader>

      {/* Main Content */}
      <ArticleForm
        characterOptions={characterOptions}
        title={title}
        onTitleChange={setTitle}
        category={category}
        onCategoryChange={handleCategoryChange}
        content={content}
        onContentChange={handleContentChange}
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={handleCancel}
        submitLabel='提交文章'
        submittingLabel='提交中...'
        errorMessage={error || categoriesError?.message || null}
        contentPlaceholder={ARTICLE_EDITOR_PLACEHOLDER}
        showCharacterSelector={showCharacterSelector}
        characterId={characterId}
        onCharacterChange={setCharacterId}
      />
    </PageShell>
  );
};

export default NewArticleClient;
