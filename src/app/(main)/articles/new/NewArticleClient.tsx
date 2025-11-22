'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';

import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';
import ArticleForm, { CategoryOption } from '@/components/articles/ArticleForm';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const NewArticleClient: React.FC = () => {
  const router = useRouter();
  const { role: userRole } = useUser();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: categoriesData, error: categoriesError } = useSWR<ArticlesData>(
    userRole ? '/api/articles?page=1&limit=1' : null,
    fetcher
  );
  const categories: Category[] =
    categoriesData?.categories.filter((category) => category.name != '根分类') || [];
  const isLoadingCategories = !categoriesData && !categoriesError;

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
    // Give some time for the user data to load
    const timer = setTimeout(() => {
      setIsInitialized(true);
      if (!userRole) {
        router.push('/articles');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [userRole, router]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
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
        body: JSON.stringify({ title: title.trim(), category, content }),
      });

      if (response.ok) {
        setSuccess('文章提交成功！正在跳转...');
        setTimeout(() => {
          router.push('/articles');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '提交文章失败');
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      setError('提交文章时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/articles');
  };

  // Loading state for user authentication
  if (!isInitialized) {
    return (
      <div className='space-y-8 dark:text-slate-200'>
        <div className='flex items-center justify-center min-h-[400px]'>
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
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>创建新文章</PageTitle>
        <PageDescription>分享你的游戏心得和攻略技巧</PageDescription>

        {/* Navigation Breadcrumb */}
        <div className='flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
          <Link
            href='/articles'
            className='hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
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
      </header>

      {/* Main Content */}
      <ArticleForm
        title={title}
        onTitleChange={setTitle}
        category={category}
        onCategoryChange={setCategory}
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
        successMessage={success}
        contentPlaceholder={ARTICLE_EDITOR_PLACEHOLDER}
      />
    </div>
  );
};

export default NewArticleClient;
