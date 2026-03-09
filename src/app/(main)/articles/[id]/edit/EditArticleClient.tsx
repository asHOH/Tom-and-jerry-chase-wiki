'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import useSWR from 'swr';

import {
  resolveEditFormState,
  type ArticleEditInfoResponse,
  type EditSourceKey,
} from '@/lib/articles/editSources';
import { formatArticleDate } from '@/lib/dateUtils';
import { normalizeHeadingLevels } from '@/lib/richTextUtils';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/context/ToastContext';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
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

const EditArticleClient: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { role: userRole, isLoading: isUserLoading, isValidating: isUserValidating } = useUser();
  const { success: showSuccess, error: showError } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EditSourceKey>('approved');

  const { data: categoriesData, error: categoriesError } = useSWR<{ categories: Category[] }>(
    userRole ? '/api/categories' : null,
    fetcher
  );
  const categories: Category[] = categoriesData?.categories || [];
  const isLoadingCategories = !categoriesData && !categoriesError;

  // Check if selected category is "角色攻略" (game strategy) - requires character binding
  const isGameStrategyCategory = (categoryId: string): boolean => {
    if (!categoryId || categories.length === 0) return false;
    const selectedCat = categories.find((c) => c.id === categoryId);
    return selectedCat?.name === '角色攻略';
  };

  const showCharacterSelector = isGameStrategyCategory(category);

  const { data: articleData, error: articleError } = useSWR<ArticleEditInfoResponse>(
    id && userRole ? `/api/articles/${id}/info` : null,
    fetcher
  );

  const applySourceToForm = useCallback(
    (source: EditSourceKey) => {
      if (!articleData) return;
      const values = resolveEditFormState(articleData, source);
      if (!values) return;

      const normalizedContent = normalizeHeadingLevels(values.content || '');
      setTitle(values.title);
      setCategory(values.category);
      setCharacterId(values.characterId);
      setPlaceholder(normalizedContent);
      setContent(normalizedContent);
    },
    [articleData]
  );

  useEffect(() => {
    if (articleData && !isInitialized) {
      const initialSource = articleData.policy.default_source;
      setSelectedSource(initialSource);
      applySourceToForm(initialSource);
      setIsInitialized(true);
    }
  }, [articleData, isInitialized, applySourceToForm]);

  useEffect(() => {
    if (!userRole && !isUserLoading && !isUserValidating) {
      router.push('/articles');
    }
  }, [userRole, isUserLoading, isUserValidating, router]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSourceChange = (source: EditSourceKey) => {
    setSelectedSource(source);
    applySourceToForm(source);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    // Clear character selection if switching away from game strategy category
    if (!isGameStrategyCategory(newCategory)) {
      setCharacterId(null);
    }
  };

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

    if (!commitMessage.trim()) {
      setError('请填写提交说明');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/articles/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content,
          // Only include character_id when required; null triggers schema validation error
          character_id: showCharacterSelector ? characterId : undefined,
          commit_message: commitMessage.trim(),
        }),
      });

      if (response.ok) {
        showSuccess('文章更新成功！正在跳转...');
        setTimeout(() => {
          router.push(`/articles/${id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        showError(errorData.message || '更新文章失败');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      showError('更新文章时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/articles/${id}`);
  };

  const isArticleLoading = !!id && !articleData && !articleError;
  const isLoading = isArticleLoading || isUserLoading || (isUserValidating && !userRole);

  // Loading state for user authentication and article data
  if (isLoading) {
    return (
      <div className='space-y-8 dark:text-slate-200'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      </div>
    );
  }

  // Redirect if user doesn't have permission
  if (!userRole) {
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
    <div className='space-y-8 dark:text-slate-200'>
      {/* Header */}
      <header className='mb-8 space-y-4 px-4 text-center'>
        <PageTitle>编辑文章</PageTitle>
        <PageDescription>修改和完善您的文章内容</PageDescription>

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
          <Link
            href={`/articles/${id}`}
            className='transition-colors hover:text-blue-600 dark:hover:text-blue-400'
          >
            文章详情
          </Link>
          <svg className='size-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
              clipRule='evenodd'
            />
          </svg>
          <span className='text-gray-900 dark:text-gray-100'>编辑文章</span>
        </div>
      </header>

      {showSourcePicker && approvedSource && pendingSource && (
        <div className='mx-auto max-w-4xl px-4'>
          <BaseCard className='space-y-4 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-900/10'>
            <div>
              <p className='text-sm font-semibold text-amber-900 dark:text-amber-200'>
                检测到您有更新的待审核版本
              </p>
              <p className='mt-1 text-xs text-amber-800 dark:text-amber-300'>请选择编辑起点。</p>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <button
                type='button'
                onClick={() => handleSourceChange('approved')}
                className={clsx(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedSource === 'approved'
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                    : 'border-gray-200 bg-white hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-blue-400'
                )}
              >
                <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  公开版本
                </div>
                <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  更新时间: {formatArticleDate(approvedSource.created_at)}
                </div>
              </button>

              <button
                type='button'
                onClick={() => handleSourceChange('pending_mine')}
                className={clsx(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedSource === 'pending_mine'
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30'
                    : 'border-gray-200 bg-white hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-blue-400'
                )}
              >
                <div className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                  我的待审核版本
                </div>
                <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  提交时间: {formatArticleDate(pendingSource.created_at)}
                </div>
                {pendingSource.commit_message && (
                  <div className='mt-1 line-clamp-1 text-xs text-gray-600 dark:text-gray-400'>
                    提交说明: {pendingSource.commit_message}
                  </div>
                )}
              </button>
            </div>
          </BaseCard>
        </div>
      )}

      {/* Main Content */}
      <ArticleForm
        title={title}
        onTitleChange={setTitle}
        category={category}
        onCategoryChange={handleCategoryChange}
        content={content}
        onContentChange={handleContentChange}
        categories={categories.filter((cat) => cat.name != '根分类')}
        isLoadingCategories={isLoadingCategories}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={handleCancel}
        submitLabel='更新文章'
        submittingLabel='更新中...'
        errorMessage={error || articleError?.message || categoriesError?.message || null}
        contentPlaceholder={placeholder}
        showCharacterSelector={showCharacterSelector}
        characterId={characterId}
        onCharacterChange={setCharacterId}
        commitMessage={commitMessage}
        onCommitMessageChange={setCommitMessage}
        showCommitMessage={true}
        submitNoticeMessage={submitNoticeMessage}
      />
    </div>
  );
};

export default EditArticleClient;
