'use client';

import React from 'react';
import clsx from 'clsx';

import { useMobile } from '@/hooks/useMediaQuery';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import BaseCard from '@/components/ui/BaseCard';
import { ArticleCharacterSelector } from '@/components/ui/CharacterSelector';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ArticleLintNotice, getArticleLintResults } from '@/components/articles/ArticleLintNotice';
import { CheckBadgeIcon, CloseIcon } from '@/components/icons/CommonIcons';

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
  // Character selector props for game strategy articles
  showCharacterSelector?: boolean;
  characterId?: string | null;
  onCharacterChange?: (characterId: string | null) => void;
  // Commit message props
  commitMessage?: string;
  onCommitMessageChange?: (value: string) => void;
  showCommitMessage?: boolean;
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
  showCharacterSelector = false,
  characterId,
  onCharacterChange,
  commitMessage = '',
  onCommitMessageChange,
  showCommitMessage = false,
}) => {
  const isMobile = useMobile();
  const typoPrefix = '修正笔误';
  const typoPrefixWithComma = '修正笔误，';
  const isTypoFixActive = showCommitMessage && commitMessage.trim().startsWith(typoPrefix);
  const lintResults = getArticleLintResults(title, content);
  const hasLintError = lintResults.some((item) => item.severity === 'error');
  const isSaveDisabled =
    isSubmitting ||
    !title.trim() ||
    !category ||
    !content ||
    (showCharacterSelector && !characterId) ||
    (showCommitMessage && !commitMessage.trim()) ||
    hasLintError;

  const toggleTypoFixPrefix = () => {
    if (!onCommitMessageChange) return;
    const current = commitMessage ?? '';
    const trimmed = current.trim();

    if (!trimmed) {
      onCommitMessageChange(typoPrefix);
      return;
    }

    if (trimmed.startsWith(typoPrefix)) {
      // Remove leading "修正笔误" or "修正笔误，" while preserving the rest
      const withoutPrefix = trimmed.startsWith(typoPrefixWithComma)
        ? trimmed.slice(typoPrefixWithComma.length)
        : trimmed.slice(typoPrefix.length);
      onCommitMessageChange(withoutPrefix.trimStart());
      return;
    }

    onCommitMessageChange(`${typoPrefixWithComma}${trimmed}`);
  };

  return (
    <div className={`mx-auto max-w-4xl ${isMobile ? '' : 'px-4'}`}>
      {(errorMessage || successMessage) && (
        <>
          {errorMessage && (
            <BaseCard
              className={`mb-6 border border-red-200 bg-red-50 ${isMobile ? '' : 'p-4'} dark:border-red-800 dark:bg-red-900/20`}
            >
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
            <BaseCard
              className={`mb-6 border border-green-200 bg-green-50 ${isMobile ? '' : 'p-4'} dark:border-green-800 dark:bg-green-900/20`}
            >
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

      <div className={isMobile ? '' : 'p-8'}>
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
              className={`w-full rounded-lg border border-gray-300 bg-white ${isMobile ? '' : 'px-4'} py-3 text-lg text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400`}
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
                className={`w-full rounded-lg border border-gray-300 bg-white ${isMobile ? '' : 'px-4'} py-3 text-lg text-gray-900 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100`}
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

          {/* Character Selector for Game Strategy Articles */}
          {showCharacterSelector && (
            <div className='space-y-2'>
              <label className='block text-lg font-semibold text-gray-900 dark:text-gray-100'>
                关联角色 <span className='text-red-500'>*</span>
              </label>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                角色攻略文章需要选择一个关联角色
              </p>
              <ArticleCharacterSelector
                selectedCharacterId={characterId ?? null}
                onSelect={onCharacterChange ?? (() => {})}
                disabled={isSubmitting}
              />
            </div>
          )}

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

          {/* Lint notices (errors/warnings) */}
          {lintResults.length > 0 && <ArticleLintNotice results={lintResults} />}

          {/* Commit Message for Updates */}
          {showCommitMessage && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <label
                    htmlFor='commit-message'
                    className='block text-lg font-semibold text-gray-900 dark:text-gray-100'
                  >
                    提交说明 <span className='text-red-500'>*</span>
                  </label>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    简要说明本次修改的内容或原因
                  </p>
                </div>

                <button
                  type='button'
                  onClick={toggleTypoFixPrefix}
                  disabled={isSubmitting || !onCommitMessageChange}
                  className={clsx(
                    'shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    isTypoFixActive
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-200',
                    isSubmitting && 'cursor-not-allowed opacity-70'
                  )}
                  aria-pressed={isTypoFixActive}
                >
                  “修正笔误”
                </button>
              </div>

              <input
                id='commit-message'
                type='text'
                value={commitMessage}
                onChange={(e) => onCommitMessageChange?.(e.target.value)}
                placeholder='如：修正笔误、更新数据、补充说明等'
                className={`w-full rounded-lg border border-gray-300 bg-white ${isMobile ? '' : 'px-4'} py-3 text-lg text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400`}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className='flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row dark:border-gray-700'>
            <button
              type='button'
              onClick={onSave}
              disabled={isSaveDisabled}
              className={clsx(
                'inline-flex flex-1 items-center justify-center gap-3 rounded-lg py-4 text-lg font-semibold transition-all duration-200 sm:flex-none',
                'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                isSaveDisabled
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                  : 'transform bg-blue-600 text-white shadow-lg hover:scale-105 hover:bg-blue-700 hover:shadow-xl',
                isMobile ? '' : 'px-8'
              )}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size='sm' />
                  {submittingLabel}
                </>
              ) : (
                <>
                  <CheckBadgeIcon className='size-5' />
                  {submitLabel}
                </>
              )}
            </button>

            <button
              type='button'
              onClick={onCancel}
              disabled={isSubmitting}
              className='inline-flex flex-1 items-center justify-center gap-3 rounded-lg bg-gray-100 px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none sm:flex-none dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            >
              <CloseIcon className='size-5' />
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
