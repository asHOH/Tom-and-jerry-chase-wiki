'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';

import { useUser } from '@/hooks/useUser';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import ArticleForm, { CategoryOption } from '@/components/articles/ArticleForm';
import Link from '@/components/Link';

interface Article {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  category_id: string;
  categories: { id: string; name: string };
  users_public_view: { nickname: string };
  latest_approved_version: Array<{
    id: string;
    content: string;
    created_at: string;
    status: string;
    editor_id: string;
    users_public_view: { nickname: string };
  }>;
}

type Category = CategoryOption;

interface ArticlesData {
  articles: Article[];
  total_count: number;
  current_page: number;
  total_pages: number;
  categories: Category[];
  has_next: boolean;
  has_prev: boolean;
}

interface ArticleInfo {
  article: {
    title: string;
    category_id: string;
    character_id: string | null;
    article_versions: Array<{ content: string }>;
  };
}
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const EditArticleClient: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { role: userRole } = useUser();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState('');

  const { data: categoriesData, error: categoriesError } = useSWR<ArticlesData>(
    userRole ? '/api/articles?page=1&limit=1' : null,
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

  const { data: articleData, error: articleError } = useSWR<ArticleInfo>(
    id && userRole ? `/api/articles/${id}/info` : null,
    fetcher
  );

  useEffect(() => {
    if (articleData) {
      setTitle(articleData.article.title);
      setCategory(articleData.article.category_id);
      setCharacterId(articleData.article.character_id);
      setPlaceholder(articleData.article.article_versions[0]?.content || '');
    }
  }, [articleData]);

  useEffect(() => {
    if (!userRole) {
      router.push('/articles');
    }
  }, [userRole, router]);

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

      const response = await fetch(`/api/articles/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content,
          character_id: showCharacterSelector ? characterId : null,
        }),
      });

      if (response.ok) {
        setSuccess('文章更新成功！正在跳转...');
        setTimeout(() => {
          router.push(`/articles/${id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '更新文章失败');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setError('更新文章时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/articles/${id}`);
  };

  const isLoading = !!id && !articleData && !articleError;

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
        successMessage={success}
        contentPlaceholder={placeholder}
        showCharacterSelector={showCharacterSelector}
        characterId={characterId}
        onCharacterChange={setCharacterId}
      />
    </div>
  );
};

export default EditArticleClient;
