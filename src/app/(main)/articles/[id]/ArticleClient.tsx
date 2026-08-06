'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AssetManager } from '@/lib/assetManager';
import { usePermissions } from '@/lib/auth/PermissionProvider';
import { formatArticleDate } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { storage, StorageKey } from '@/lib/localStorage';
import type { FactionId } from '@/data/types';
import { useArticleToc } from '@/features/articles/hooks/useArticleToc';
import Button from '@/components/ui/Button';
import ButtonLink from '@/components/ui/ButtonLink';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import CommentsSection from '@/components/comments/CommentsSection';
import {
  ClockIcon,
  EyeIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';

interface ArticleData {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  created_at: string;
  view_count?: number;
  character_id?: string | null;
  categories: { name: string };
  users_public_view: { nickname: string | null } | null;
  latest_version: {
    id: string | null;
    content: string | null;
    created_at: string | null;
    editor_id: string | null;
    users_public_view: { nickname: string | null } | null;
  };
}

// const fetcher = (url: string) =>
//   fetch(url).then((res) => {
//     if (!res.ok) {
//       const error = new Error('An error occurred while fetching the data.') as Error & {
//         info: unknown;
//         status: number;
//       };
//       error.info = res.json();
//       error.status = res.status;
//       throw error;
//     }
//     return res.json();
//   });

export default function ArticleClient({
  article,
  boundCharacter,
  sanitizedContent,
}: {
  article: ArticleData;
  boundCharacter: { id: string; factionId?: FactionId } | null;
  sanitizedContent: string;
}) {
  const permissions = usePermissions();
  const articleId = article.id;
  const [showAutoNumbering, setShowAutoNumbering] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Persist auto-numbering preference
  useEffect(() => {
    setMounted(true);
    const saved = storage.getItem(StorageKey.ArticleAutoNumbering);
    if (saved !== null) {
      setShowAutoNumbering(saved === 'true');
    }
  }, []);

  useEffect(() => {
    storage.setItem(StorageKey.ArticleAutoNumbering, String(showAutoNumbering));
  }, [showAutoNumbering]);

  useEffect(() => {
    const updateProgress = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setReadingProgress((currentScroll / scrollHeight) * 100);
      }
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  const articleContent = article.latest_version?.content ?? '';
  const { contentRef, tocItems, activeHeadingId } = useArticleToc({
    articleId,
    content: articleContent,
    showAutoNumbering,
  });

  const canEdit = permissions.has('article.update_own') || permissions.has('article.update_any');
  const titleSize = article.title.length <= 10 ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';
  const hasToc = tocItems.length > 0;
  const minHeadingLevel = useMemo(() => {
    if (!tocItems.length) {
      return 1;
    }
    const firstLevel = tocItems[0]?.level ?? 1;
    return tocItems.reduce((minLevel, item) => Math.min(minLevel, item.level), firstLevel);
  }, [tocItems]);

  // Get bound character info if this is a game strategy article
  const renderTocList = (itemClassName: string, showHeadingLabel = true) => (
    <nav aria-label='文章目录'>
      {showHeadingLabel && (
        <div className='mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200'>目录</div>
      )}
      <ul className='space-y-1'>
        {tocItems.map((item) => {
          const isActive = activeHeadingId === item.id;
          const levelOffset = Math.max(item.level - minHeadingLevel, 0);
          return (
            <li key={item.id} style={{ marginLeft: `${levelOffset * 12}px` }}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'block rounded px-2 py-1 text-sm transition-colors',
                  itemClassName,
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300'
                )}
              >
                {showAutoNumbering && <span className='mr-1 opacity-70'>{item.prefix}</span>}
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <PageShell width='maximum' className='py-2 md:py-8'>
      {/* Reading Progress Bar - Teleported to body to escape transformed containers */}
      {mounted &&
        createPortal(
          <div className='pointer-events-none fixed top-0 left-0 z-9999 h-0.5 w-full bg-transparent'>
            <div
              className='h-full bg-blue-500/80 transition-all duration-150 ease-out dark:bg-blue-400/80'
              style={{ width: `${readingProgress}%` }}
            />
          </div>,
          document.body
        )}

      <div className='flex flex-col lg:flex-row lg:items-start lg:gap-10'>
        {hasToc && (
          <Card
            as='aside'
            bordered
            className='bg-surface/60 dark:bg-background/40 sticky top-24 hidden h-max max-h-[75vh] overflow-auto shadow-sm backdrop-blur lg:block lg:w-64'
          >
            {renderTocList('text-left')}
          </Card>
        )}

        <div className='flex-1'>
          {/* Header */}
          <div className='mb-8 flex flex-col'>
            <PageHeader title={article.title} titleClassName={titleSize} />

            {/* Article Meta */}
            <div className='p-2 md:mt-6 md:rounded-lg md:border md:border-gray-200 md:p-6 dark:md:border-gray-700'>
              <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
                <div className='flex items-center gap-2'>
                  <UserCircleIcon className='size-4' strokeWidth={1.5} />
                  <span>
                    作者:{' '}
                    {article.users_public_view?.nickname ? (
                      <Link
                        href={`/users/${encodeURIComponent(article.users_public_view.nickname)}`}
                        className='hover:text-blue-600 hover:underline dark:hover:text-blue-400'
                      >
                        {article.users_public_view.nickname}
                      </Link>
                    ) : (
                      '未知用户'
                    )}
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <FolderIcon className='size-4' strokeWidth={1.5} />

                  <span>分类: {article.categories?.name || '未分类'}</span>
                </div>

                {boundCharacter && (
                  <ButtonLink
                    href={`/characters/${encodeURIComponent(boundCharacter.id)}`}
                    variant='secondary'
                    size='sm'
                    leadingIcon={
                      <Image
                        src={AssetManager.getCharacterImageUrl(
                          boundCharacter.id,
                          boundCharacter.factionId ?? 'cat'
                        )}
                        alt={boundCharacter.id}
                        width={24}
                        height={24}
                        className='h-6 w-6 rounded-full object-cover ring-1 ring-blue-400 dark:ring-blue-500'
                      />
                    }
                  >
                    查看{boundCharacter.id}详情
                  </ButtonLink>
                )}

                <div className='flex items-center gap-2'>
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  <span>创建于: {formatArticleDate(article.created_at)}</span>
                </div>

                <div className='flex items-center gap-2'>
                  <EyeIcon className='size-4' strokeWidth={1.5} />

                  <span>浏览: {article.view_count ?? 0}</span>
                </div>

                {article.latest_version.created_at &&
                  article.latest_version.created_at !== article.created_at && (
                    <div className='flex items-center gap-2'>
                      <PencilSquareIcon className='size-4' strokeWidth={1.5} />

                      <span>
                        最后编辑: {formatArticleDate(article.latest_version.created_at)}
                        {article.latest_version.users_public_view?.nickname &&
                          article.latest_version.editor_id && (
                            <>
                              {' 由 '}
                              <Link
                                href={`/users/${encodeURIComponent(article.latest_version.users_public_view.nickname)}`}
                                className='hover:text-blue-600 hover:underline dark:hover:text-blue-400'
                              >
                                {article.latest_version.users_public_view.nickname}
                              </Link>
                            </>
                          )}
                      </span>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className='mt-4 flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700'>
                <Button
                  onClick={() => setShowAutoNumbering(!showAutoNumbering)}
                  variant={showAutoNumbering ? 'primary' : 'secondary'}
                >
                  {showAutoNumbering ? '隐藏编号' : '自动编号'}
                </Button>

                <ButtonLink
                  href={`/articles/${articleId}/history`}
                  variant='secondary'
                  leadingIcon={<ClockIcon className='size-4' strokeWidth={1.5} />}
                >
                  历史版本
                </ButtonLink>

                {canEdit && (
                  <ButtonLink
                    href={`/articles/${articleId}/edit`}
                    leadingIcon={<PencilSquareIcon className='size-4' strokeWidth={1.5} />}
                  >
                    编辑文章
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>

          {hasToc && (
            <Card bordered className='bg-surface/70 dark:bg-background/40 mb-6 shadow-sm lg:hidden'>
              <details open>
                <summary className='cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200'>
                  目录
                </summary>
                <div className='mt-3'>{renderTocList('text-left', false)}</div>
              </details>
            </Card>
          )}

          {/* Article Content */}
          <div
            ref={contentRef}
            className={cn(
              'article-content md:rounded-lg md:border md:border-transparent md:p-0 lg:bg-white/70 lg:p-8 lg:shadow-sm dark:lg:border-gray-800 dark:lg:bg-gray-900/40',
              showAutoNumbering && 'article-content-auto-numbered'
            )}
          >
            <RichTextDisplay
              content={article.latest_version?.content}
              sanitizedContent={sanitizedContent}
            />
          </div>

          <CommentsSection scope='articles' targetId={article.id} />

          {/* Footer Actions */}
          <div className='mt-8 text-center'>
            <div className='mb-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400'>
              <EyeIcon className='size-4' strokeWidth={1.5} />

              <span>正在查看已发布版本</span>
            </div>

            <div className='flex flex-wrap justify-center gap-3'>
              <Link
                href='/articles'
                className='px-4 py-2 text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              >
                浏览更多文章
              </Link>

              {canEdit && (
                <ButtonLink href='/articles/new' variant='success'>
                  创建新文章
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
