'use client';

import {
  ClockIcon,
  EyeIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ArticleData {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  created_at: string;
  view_count?: number;
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

interface TocItem {
  id: string;
  text: string;
  level: number;
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

export default function ArticleClient({ article }: { article: ArticleData }) {
  const params = useParams();
  const { role: userRole } = useUser();
  const articleId = params?.id as string;
  const isMobile = useMobile();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const articleContent = useMemo(
    () => article.latest_version?.content ?? '',
    [article.latest_version?.content]
  );

  useEffect(() => {
    const container = contentRef.current;
    if (!container) {
      setTocItems([]);
      return;
    }

    const generateTocItems = () => {
      const headingElements = Array.from(
        container.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')
      );

      if (!headingElements.length) {
        setTocItems((prev) => {
          if (!prev.length) {
            return prev;
          }
          return [];
        });
        setActiveHeadingId((prev) => (prev ? '' : prev));
        return;
      }

      const slugCounts: Record<string, number> = {};
      const mapHeadingToId = (text: string, fallbackIndex: number) => {
        const normalizedText = text
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '');

        const baseId = normalizedText || `section-${fallbackIndex + 1}`;
        const currentCount = slugCounts[baseId] ?? 0;
        slugCounts[baseId] = currentCount + 1;
        return currentCount ? `${baseId}-${currentCount}` : baseId;
      };

      const generatedItems = headingElements
        .map((heading, index) => {
          const rawText = heading.textContent?.trim() ?? '';
          if (!rawText) {
            return null;
          }

          const level = Number(heading.tagName.substring(1));
          const existingId = heading.id.trim();
          const id = existingId || mapHeadingToId(rawText, index);
          heading.id = id;
          heading.classList.add('scroll-mt-24');

          return { id, text: rawText, level } satisfies TocItem;
        })
        .filter((item): item is TocItem => Boolean(item));

      setTocItems((prev) => {
        if (
          prev.length === generatedItems.length &&
          prev.every((item, idx) => {
            const next = generatedItems[idx];
            if (!next) {
              return false;
            }
            return item.id === next.id && item.text === next.text && item.level === next.level;
          })
        ) {
          return prev;
        }
        return generatedItems;
      });

      setActiveHeadingId((prev) =>
        prev && generatedItems.some((item) => item.id === prev)
          ? prev
          : (generatedItems[0]?.id ?? '')
      );
    };

    generateTocItems();

    const observer = new MutationObserver(() => {
      generateTocItems();
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [articleContent]);

  useEffect(() => {
    if (!tocItems.length) {
      return;
    }

    const handleScroll = () => {
      let currentId = tocItems[0]?.id ?? '';
      for (const item of tocItems) {
        const element = document.getElementById(item.id);
        if (!element) {
          continue;
        }
        const { top } = element.getBoundingClientRect();
        if (top <= 128) {
          currentId = item.id;
        } else {
          break;
        }
      }

      setActiveHeadingId((prev) => (prev === currentId ? prev : currentId));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const canEdit =
    userRole === 'Contributor' || userRole === 'Reviewer' || userRole === 'Coordinator';
  const titleSize = !isMobile ? 'text-4xl' : article.title.length <= 10 ? 'text-3xl' : 'text-2xl';
  const hasToc = tocItems.length > 0;
  const minHeadingLevel = useMemo(() => {
    if (!tocItems.length) {
      return 1;
    }
    const firstLevel = tocItems[0]?.level ?? 1;
    return tocItems.reduce((minLevel, item) => Math.min(minLevel, item.level), firstLevel);
  }, [tocItems]);

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
                className={`block rounded px-2 py-1 text-sm transition-colors ${itemClassName} ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300'
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className={`container mx-auto ${isMobile ? 'px-1 py-2' : 'px-6 py-8'} max-w-6xl`}>
      <div className='flex flex-col lg:flex-row lg:items-start lg:gap-10'>
        {hasToc && (
          <aside className='sticky top-24 hidden h-max max-h-[75vh] overflow-auto rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/40 lg:block lg:w-64'>
            {renderTocList('text-left')}
          </aside>
        )}

        <div className='flex-1'>
          {/* Header */}
          <div className='mb-8 flex flex-col'>
            <header className='text-center'>
              <h1 className={`${titleSize} font-bold text-blue-600 dark:text-blue-400 py-3`}>
                {article.title}
              </h1>
            </header>

            {/* Article Meta */}
            <div
              className={
                isMobile ? 'p-2' : 'mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700'
              }
            >
              <div className='flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400'>
                <div className='flex items-center gap-2'>
                  <UserCircleIcon className='size-4' strokeWidth={1.5} />
                  <span>作者: {article.users_public_view?.nickname || '未知用户'}</span>
                </div>

                <div className='flex items-center gap-2'>
                  <FolderIcon className='size-4' strokeWidth={1.5} />

                  <span>分类: {article.categories?.name || '未分类'}</span>
                </div>

                <div className='flex items-center gap-2'>
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  <span>
                    创建于:{' '}
                    {format(new Date(article.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>

                <div className='flex items-center gap-2'>
                  <EyeIcon className='size-4' strokeWidth={1.5} />

                  <span>浏览: {article.view_count ?? 0}</span>
                </div>

                {article.latest_version && (
                  <div className='flex items-center gap-2'>
                    <PencilSquareIcon className='size-4' strokeWidth={1.5} />

                    <span>
                      最后编辑:{' '}
                      {format(
                        new Date(article.latest_version.created_at!),
                        'yyyy年MM月dd日 HH:mm',
                        {
                          locale: zhCN,
                        }
                      )}
                      {article.latest_version.users_public_view?.nickname &&
                        ` 由 ${article.latest_version.users_public_view.nickname}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='mt-4 flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
                <Link
                  href={`/articles/${articleId}/history`}
                  className='inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  查看历史版本
                </Link>

                {canEdit && (
                  <Link
                    href={`/articles/${articleId}/edit`}
                    className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                  >
                    <PencilSquareIcon className='size-4' strokeWidth={1.5} />
                    编辑文章
                  </Link>
                )}
              </div>
            </div>
          </div>

          {hasToc && (
            <div className='mb-6 rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 lg:hidden'>
              <details open>
                <summary className='cursor-pointer text-sm font-semibold text-gray-800 dark:text-gray-200'>
                  目录
                </summary>
                <div className='mt-3'>{renderTocList('text-left', false)}</div>
              </details>
            </div>
          )}

          {/* Article Content */}
          <div
            ref={contentRef}
            className={
              isMobile
                ? ''
                : 'rounded-lg border border-transparent p-0 lg:bg-white/70 lg:p-8 lg:shadow-sm dark:lg:border-gray-800 dark:lg:bg-gray-900/40'
            }
          >
            <RichTextDisplay content={article.latest_version?.content} />
          </div>

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
                <Link
                  href='/articles/new'
                  className='rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
                >
                  创建新文章
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
