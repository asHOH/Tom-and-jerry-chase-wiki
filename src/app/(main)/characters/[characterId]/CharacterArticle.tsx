'use client';

import { use } from 'react';

import { formatCompactDate } from '@/lib/dateUtils';
import { sanitizeHTML } from '@/lib/xssUtils';
import CharacterSection from '@/features/characters/components/character-detail/sections/CharacterSection';
import AccordionCard from '@/components/ui/AccordionCard';
import ButtonLink from '@/components/ui/ButtonLink';
import StyledMDX from '@/components/ui/StyledMDX';
import { ClockIcon, EyeIcon, FolderIcon, UserCircleIcon } from '@/components/icons/CommonIcons';

type CharacterArticleItem = {
  id: string | null;
  title?: string | null;
  content: string | null;
  authors: string[];
  createdAt?: string | null;
  viewCount?: number | null;
  categoryName?: string | null;
  articleCreatedAt?: string | null;
};

type CharacterArticleResult = CharacterArticleItem | CharacterArticleItem[] | null;

const SECTION_TITLE = '\u64cd\u4f5c\u6280\u5de7';
const DEFAULT_ARTICLE_TITLE = '\u6587\u7ae0';
const UNKNOWN_AUTHOR = '\u672a\u77e5';
const AUTHOR_LABEL = '\u4f5c\u8005\uff1a';
const AUTHOR_SEPARATOR = '\u3001';

export default function CharacterArticle({
  content,
}: {
  content: Promise<CharacterArticleResult>;
}) {
  const result = use(content);

  const articles: CharacterArticleItem[] = Array.isArray(result) ? result : result ? [result] : [];

  if (articles.length === 0) {
    return null;
  }

  if (articles.length === 1) {
    const single = articles[0];
    if (!single?.id || !single.content) return null;

    const title = single.title?.trim() || DEFAULT_ARTICLE_TITLE;
    const authors = single.authors ?? [];
    const dateText = single.createdAt
      ? formatCompactDate(single.createdAt, { invalidFallback: '' })
      : '';
    const categoryName = single.categoryName ?? null;
    const viewCount = single.viewCount ?? null;

    return (
      <CharacterSection title={SECTION_TITLE}>
        <div className='mt-2 space-y-3'>
          <h1 className='py-3 text-center text-4xl font-bold text-blue-600 dark:text-blue-400'>
            {title}
          </h1>

          {/* Meta Info */}
          <div className='mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
            <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
              <div className='flex items-center gap-2'>
                <UserCircleIcon className='size-4' strokeWidth={1.5} />
                <span>
                  {AUTHOR_LABEL}
                  {authors.length > 0 ? authors.join(AUTHOR_SEPARATOR) : UNKNOWN_AUTHOR}
                </span>
              </div>
              {categoryName && (
                <div className='flex items-center gap-2'>
                  <FolderIcon className='size-4' strokeWidth={1.5} />
                  <span>分类: {categoryName}</span>
                </div>
              )}
              {viewCount != null && (
                <div className='flex items-center gap-2'>
                  <EyeIcon className='size-4' strokeWidth={1.5} />
                  <span>浏览: {viewCount}</span>
                </div>
              )}
              {dateText && (
                <div className='flex items-center gap-2'>
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  <span>更新于 {dateText}</span>
                </div>
              )}
            </div>
            <div className='mt-3 flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-700'>
              <ButtonLink
                href={`/articles/${encodeURIComponent(single.id)}`}
                size='sm'
                variant='secondary'
              >
                查看全文
              </ButtonLink>
              <ButtonLink
                href={`/articles/${encodeURIComponent(single.id)}/history`}
                size='sm'
                variant='secondary'
                leadingIcon={<ClockIcon className='size-4' strokeWidth={1.5} />}
              >
                历史版本
              </ButtonLink>
            </div>
          </div>

          <StyledMDX
            className='mx-0 max-w-none p-0 sm:p-0'
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(single.content) }}
          />
        </div>
      </CharacterSection>
    );
  }

  const normalizedArticles = articles.filter((a): a is CharacterArticleItem & { id: string } =>
    Boolean(a?.id)
  );
  const firstId = normalizedArticles[0]?.id;

  if (!firstId) {
    return null;
  }

  return (
    <CharacterSection title={SECTION_TITLE}>
      <div className='mx-2'>
        <AccordionCard
          defaultOpenId={firstId}
          size='xs'
          titleClassName='rounded-md'
          contentContainerClassName='mt-2'
          buttonClassName='px-2'
          items={normalizedArticles.map((article) => {
            const title = article.title?.trim() || DEFAULT_ARTICLE_TITLE;
            const authorsText =
              article.authors && article.authors.length > 0
                ? article.authors.join(AUTHOR_SEPARATOR)
                : UNKNOWN_AUTHOR;
            const dateText = article.createdAt
              ? formatCompactDate(article.createdAt, { invalidFallback: '' })
              : '';
            const articleCategoryName = article.categoryName ?? null;
            const articleViewCount = article.viewCount ?? null;

            return {
              id: article.id,
              title,
              className: 'py-2',
              children: (
                <div className='space-y-3 px-1 py-2'>
                  {/* Meta Info */}
                  <div className='rounded-lg border border-gray-200 p-3 dark:border-gray-700'>
                    <div className='flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400'>
                      <div className='flex items-center gap-2'>
                        <UserCircleIcon className='size-4' strokeWidth={1.5} />
                        <span>
                          {AUTHOR_LABEL}
                          {authorsText}
                        </span>
                      </div>
                      {articleCategoryName && (
                        <div className='flex items-center gap-2'>
                          <FolderIcon className='size-4' strokeWidth={1.5} />
                          <span>分类: {articleCategoryName}</span>
                        </div>
                      )}
                      {articleViewCount != null && (
                        <div className='flex items-center gap-2'>
                          <EyeIcon className='size-4' strokeWidth={1.5} />
                          <span>浏览: {articleViewCount}</span>
                        </div>
                      )}
                      {dateText && (
                        <div className='flex items-center gap-2'>
                          <ClockIcon className='size-4' strokeWidth={1.5} />
                          <span>更新于 {dateText}</span>
                        </div>
                      )}
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-700'>
                      <ButtonLink
                        href={`/articles/${encodeURIComponent(article.id)}`}
                        size='sm'
                        variant='secondary'
                      >
                        查看全文
                      </ButtonLink>
                      <ButtonLink
                        href={`/articles/${encodeURIComponent(article.id)}/history`}
                        size='sm'
                        variant='secondary'
                        leadingIcon={<ClockIcon className='size-4' strokeWidth={1.5} />}
                      >
                        历史版本
                      </ButtonLink>
                    </div>
                  </div>
                  {article.content ? (
                    <StyledMDX
                      className='mx-0 max-w-none p-0 sm:p-0'
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.content) }}
                    />
                  ) : null}
                </div>
              ),
            };
          })}
        />
      </div>
    </CharacterSection>
  );
}
