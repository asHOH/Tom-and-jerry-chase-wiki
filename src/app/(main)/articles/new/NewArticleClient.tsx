'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import type { ArticleCharacterOption } from '@/lib/articles/articleCharacterOptions';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { fetchJson } from '@/lib/fetchJson';
import { useUser } from '@/hooks/useUser';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import { useArticleSubmission } from '@/features/articles/hooks/useArticleSubmission';
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
  const { submit, isSubmitting } = useArticleSubmission();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const showCharacterSelector =
    categories.find((categoryOption) => categoryOption.id === category)?.requires_character ??
    false;

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
    const requiresCharacter =
      categories.find((categoryOption) => categoryOption.id === newCategory)?.requires_character ??
      false;
    if (!requiresCharacter) {
      setCharacterId(null);
    }
  };

  const handleSave = async () => {
    if (isSubmitting || isLoadingCategories) {
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

    setError(null);
    await submit({
      kind: 'create',
      draft: {
        title,
        category,
        content,
        characterId: showCharacterSelector ? characterId : undefined,
      },
    });
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
