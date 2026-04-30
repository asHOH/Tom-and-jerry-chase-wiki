'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/design';
import { normalizeHeadingLevels } from '@/lib/richTextUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { ARTICLE_EDITOR_PLACEHOLDER } from '@/constants/articles';
import BaseCard from '@/components/ui/BaseCard';
import Button from '@/components/ui/Button';
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
  contentPlaceholder?: string;
  // Character selector props for game strategy articles
  showCharacterSelector?: boolean;
  characterId?: string | null;
  onCharacterChange?: (characterId: string | null) => void;
  // Commit message props
  commitMessage?: string;
  onCommitMessageChange?: (value: string) => void;
  showCommitMessage?: boolean;
  submitNoticeMessage?: string | null;
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
  contentPlaceholder,
  showCharacterSelector = false,
  characterId,
  onCharacterChange,
  commitMessage = '',
  onCommitMessageChange,
  showCommitMessage = false,
  submitNoticeMessage = null,
}) => {
  const isMobile = useMobile();
  const typoPrefix = '修正笔误';
  const typoPrefixWithComma = '修正笔误，';
  const isTypoFixActive = showCommitMessage && commitMessage.trim().startsWith(typoPrefix);
  const lintResults = getArticleLintResults(title, content);
  const hasLintError = lintResults.some((item) => item.severity === 'error');
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  const isSaveDisabled =
    isSubmitting ||
    isLoadingCategories ||
    (!!category && (categories.length === 0 || !categories.find((c) => c.id === category))) ||
    !title.trim() ||
    !category ||
    !content ||
    (showCharacterSelector && !characterId) ||
    (showCommitMessage && !commitMessage.trim()) ||
    hasLintError ||
    !agreedToLicense;

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

  const handleNormalizeHeadings = () => {
    const normalized = normalizeHeadingLevels(content);
    onContentChange(normalized);
  };

  return (
    <div className={cn('mx-auto max-w-4xl', !isMobile && 'px-4')}>
      {errorMessage && (
        <BaseCard
          className={cn(
            'mb-6 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
            !isMobile && 'p-4'
          )}
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
              className={cn('form-control', !isMobile && 'px-4')}
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
                className={cn('form-control', !isMobile && 'px-4')}
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
          {lintResults.length > 0 && (
            <ArticleLintNotice results={lintResults} onFixHeadings={handleNormalizeHeadings} />
          )}

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
                  className={cn(
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
                className={cn('form-control', !isMobile && 'px-4')}
                disabled={isSubmitting}
              />
            </div>
          )}

          {submitNoticeMessage && (
            <BaseCard className='border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-900/10'>
              <p className='text-sm text-amber-900 dark:text-amber-200'>{submitNoticeMessage}</p>
            </BaseCard>
          )}

          <div className='mt-4 flex items-start gap-2 py-2'>
            <input
              type='checkbox'
              id='license-agreement'
              checked={agreedToLicense}
              onChange={(e) => setAgreedToLicense(e.target.checked)}
              className='mt-1 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800'
              disabled={isSubmitting}
            />
            <label
              htmlFor='license-agreement'
              className='cursor-pointer text-sm text-gray-700 select-none dark:text-gray-300'
            >
              提交即表示您同意将修改内容根据{' '}
              <a
                href='https://creativecommons.org/licenses/by/4.0/deed.zh-hans'
                className='text-blue-600 hover:underline dark:text-blue-400'
                target='_blank'
                rel='noopener noreferrer'
                title='Creative Commons Attribution 4.0 International'
              >
                CC BY 4.0 许可协议
              </a>{' '}
              进行授权发布。
            </label>
          </div>

          <div className='flex flex-col gap-4 border-t border-gray-200 pt-6 md:flex-row dark:border-gray-700'>
            <Button
              type='button'
              onClick={onSave}
              disabled={isSaveDisabled}
              loading={isSubmitting}
              variant='primary'
              size='lg'
              fullWidth={isMobile}
              className={cn(
                'flex-1 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl sm:flex-none',
                !isMobile && 'px-8'
              )}
              leadingIcon={!isSubmitting ? <CheckBadgeIcon className='size-5' /> : undefined}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>

            <Button
              type='button'
              onClick={onCancel}
              disabled={isSubmitting}
              variant='secondary'
              size='lg'
              fullWidth={isMobile}
              className='flex-1 sm:flex-none'
              leadingIcon={<CloseIcon className='size-5' />}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
