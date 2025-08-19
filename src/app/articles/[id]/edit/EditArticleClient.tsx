'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

import RichTextEditor from '@/components/ui/RichTextEditor';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useUser } from '@/hooks/useUser';

interface Category {
  id: string;
  name: string;
}

const EditArticleClient: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { role: userRole } = useUser();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch('/api/articles?page=1&limit=1');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        setError('获取分类列表失败');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('获取分类列表时发生错误');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Fetch article data
  useEffect(() => {
    if (!userRole) {
      router.push('/articles');
      return;
    }

    if (id) {
      Promise.all([fetch(`/api/articles/${id}/info`), fetchCategories()])
        .then(async ([articleResponse]) => {
          if (!articleResponse.ok) {
            throw new Error('Failed to fetch article information');
          }
          const data = await articleResponse.json();
          setTitle(data.article.title);
          setCategory(data.article.category_id);
          setContent(data.article.article_versions[0]?.content || '');
        })
        .catch((error) => {
          console.error('Error fetching article information:', error);
          setError('加载文章信息失败');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, userRole, router, fetchCategories]);

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

    if (
      !content ||
      content.trim() === '<p></p>' ||
      content.trim() === '' ||
      content.trim() === '<p>开始编写您的内容...</p>'
    ) {
      setError('请输入文章内容');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/articles/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), category, content }),
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

  // Loading state for user authentication and article data
  if (isLoading) {
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
        <PageTitle>编辑文章</PageTitle>
        <PageDescription>修改和完善您的文章内容</PageDescription>

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
          <Link
            href={`/articles/${id}`}
            className='hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
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
      <div className='max-w-4xl mx-auto px-4'>
        {/* Alert Messages */}
        {error && (
          <BaseCard className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'>
            <div className='flex items-center gap-3'>
              <svg
                className='size-5 text-red-600 dark:text-red-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-red-800 dark:text-red-200'>{error}</p>
            </div>
          </BaseCard>
        )}

        {success && (
          <BaseCard className='mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
            <div className='flex items-center gap-3'>
              <svg
                className='size-5 text-green-600 dark:text-green-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <p className='text-green-800 dark:text-green-200'>{success}</p>
            </div>
          </BaseCard>
        )}

        {/* Article Form */}
        <BaseCard className='p-8'>
          <form onSubmit={(e) => e.preventDefault()} className='space-y-8'>
            {/* Title Input */}
            <div className='space-y-2'>
              <label
                htmlFor='title'
                className='block text-lg font-semibold text-gray-900 dark:text-gray-100'
              >
                文章标题 <span className='text-red-500'>*</span>
              </label>
              <input
                id='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='请输入文章标题...'
                className='w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                disabled={isSubmitting}
              />
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                输入一个清晰、描述性的标题来吸引读者
              </p>
            </div>

            {/* Category Select */}
            <div className='space-y-2'>
              <label
                htmlFor='category'
                className='block text-lg font-semibold text-gray-900 dark:text-gray-100'
              >
                文章分类 <span className='text-red-500'>*</span>
              </label>
              {isLoadingCategories ? (
                <div className='flex items-center gap-2 py-3'>
                  <LoadingSpinner size='sm' />
                  <span className='text-gray-600 dark:text-gray-400'>加载分类中...</span>
                </div>
              ) : (
                <select
                  id='category'
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className='w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  disabled={isSubmitting}
                >
                  <option value=''>请选择文章分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <p className='text-sm text-gray-600 dark:text-gray-400'>选择最符合文章内容的分类</p>
            </div>

            {/* Content Editor */}
            <div className='space-y-2'>
              <label className='block text-lg font-semibold text-gray-900 dark:text-gray-100'>
                文章内容 <span className='text-red-500'>*</span>
              </label>
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder='开始编写您的精彩内容...'
              />
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                使用富文本编辑器修改文章内容，支持格式化、链接、图片、表格等多种功能
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={handleSave}
                disabled={isSubmitting || !title.trim() || !category || !content}
                className={clsx(
                  'flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isSubmitting || !title.trim() || !category || !content
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                )}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size='sm' />
                    更新中...
                  </>
                ) : (
                  <>
                    <svg
                      className='size-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={2}
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M4.5 12.75l6 6 9-13.5'
                      />
                    </svg>
                    更新文章
                  </>
                )}
              </button>

              <button
                type='button'
                onClick={handleCancel}
                disabled={isSubmitting}
                className='flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              >
                <svg
                  className='size-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
                取消
              </button>
            </div>
          </form>
        </BaseCard>
      </div>
    </div>
  );
};

export default EditArticleClient;
