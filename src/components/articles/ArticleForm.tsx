'use client';

import React from 'react';
import clsx from 'clsx';

import BaseCard from '@/components/ui/BaseCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';

export interface CategoryOption {
  id: string;
  name: string;
}

interface ArticleFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  categories: CategoryOption[];
  isLoadingCategories: boolean;
  isSubmitting: boolean;
  onSave: () => void;
  onCancel: () => void;
  submitLabel: string; // e.g., '提交文章' | '更新文章'
  submittingLabel: string; // e.g., '提交中...' | '更新中...'
  errorMessage?: string | null;
  successMessage?: string | null;
  contentPlaceholder?: string;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  content,
  onContentChange,
  categories,
  isLoadingCategories,
  isSubmitting,
  onSave,
  onCancel,
  submitLabel,
  submittingLabel,
  errorMessage,
  successMessage,
  contentPlaceholder,
}) => {
  const isSaveDisabled = isSubmitting || !title.trim() || !category || !content;

  return (
    <div className='max-w-4xl mx-auto px-4'>
      {(errorMessage || successMessage) && (
        <>
          {errorMessage && (
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
                <p className='text-red-800 dark:text-red-200'>{errorMessage}</p>
              </div>
            </BaseCard>
          )}
          {successMessage && (
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
                <p className='text-green-800 dark:text-green-200'>{successMessage}</p>
              </div>
            </BaseCard>
          )}
        </>
      )}

      <div className='p-8'>
        <form onSubmit={(e) => e.preventDefault()} className='space-y-8'>
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
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder='请保证标题清晰准确'
              className='w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
              disabled={isSubmitting}
            />
          </div>

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
                onChange={(e) => onCategoryChange(e.target.value)}
                className='w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                disabled={isSubmitting}
              >
                <option value=''>请选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className='space-y-2'>
            <label className='block text-lg font-semibold text-gray-900 dark:text-gray-100'>
              文章内容 <span className='text-red-500'>*</span>
            </label>
            <RichTextEditor
              content={content}
              onChange={onContentChange}
              placeholder={contentPlaceholder ?? ARTICLE_EDITOR_PLACEHOLDER}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <button
              type='button'
              onClick={onSave}
              disabled={isSaveDisabled}
              className={clsx(
                'flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSaveDisabled
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
              )}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size='sm' />
                  {submittingLabel}
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
                    <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
                  </svg>
                  {submitLabel}
                </>
              )}
            </button>

            <button
              type='button'
              onClick={onCancel}
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
      </div>
    </div>
  );
};

export default ArticleForm;
