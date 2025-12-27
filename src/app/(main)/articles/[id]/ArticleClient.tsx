'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import clsx from 'clsx';

import { AssetManager } from '@/lib/assetManager';
import { formatArticleDate } from '@/lib/dateUtils';
import { toChineseNumeral } from '@/lib/textUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import RichTextDisplay from '@/components/ui/RichTextDisplay';
import {
  ClockIcon,
  EyeIcon,
  FolderIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { characters } from '@/data';

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

interface TocItem {
  id: string;
  text: string;
  level: number;
  prefix: string;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const removeLeadingCharactersFromHeading = (heading: HTMLHeadingElement, count: number) => {
  if (!count) {
    return;
  }
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, null);
  let remaining = count;

  while (remaining > 0) {
    const node = walker.nextNode() as Text | null;
    if (!node) {
      break;
    }
    const text = node.textContent ?? '';
    if (!text.length) {
      continue;
    }
    if (text.length <= remaining) {
      node.textContent = '';
      remaining -= text.length;
    } else {
      node.textContent = text.slice(remaining);
      remaining = 0;
    }
  }
  heading.normalize();
};

const buildHeadingPrefixMatchers = (prefix: string, numericTokens: number[]): RegExp[] => {
  const candidates = new Set<string>();
  const trimmedPrefix = prefix.trim();
  if (trimmedPrefix) {
    candidates.add(trimmedPrefix);
  }
  if (trimmedPrefix.endsWith('、') || trimmedPrefix.endsWith('.')) {
    candidates.add(trimmedPrefix.slice(0, -1).trim());
  }

  if (numericTokens.length) {
    const numericSequence = numericTokens.join('.');
    candidates.add(numericSequence);
    candidates.add(`${numericSequence}.`);
    candidates.add(`${numericSequence}、`);
  }

  if (numericTokens.length === 1) {
    const chinese = toChineseNumeral(numericTokens[0] ?? 0);
    if (chinese) {
      candidates.add(chinese);
      candidates.add(`${chinese}、`);
      candidates.add(`${chinese}.`);
    }
  }

  const matchers: RegExp[] = [];
  candidates.forEach((candidate) => {
    if (!candidate) {
      return;
    }
    const escaped = escapeRegExp(candidate);
    if (!escaped) {
      return;
    }
    matchers.push(new RegExp(`^${escaped}(?:[\\s、.:-]+)?`));
  });

  if (numericTokens.length > 1) {
    const sequence = numericTokens.map((token) => escapeRegExp(String(token))).join('[\\s、.:-]+');
    matchers.push(new RegExp(`^${sequence}(?:[\\s、.:-]+)?`));
  }

  return matchers;
};

const stripExistingHeadingNumbering = (
  heading: HTMLHeadingElement,
  rawText: string,
  prefix: string,
  numericTokens: number[]
): string => {
  if (!rawText.trim()) {
    return rawText;
  }
  const leadingWhitespaceMatch = rawText.match(/^\s+/);
  const leadingWhitespaceLength = leadingWhitespaceMatch?.[0]?.length ?? 0;
  const trimmed = rawText.slice(leadingWhitespaceLength);
  if (!trimmed) {
    return rawText.trim();
  }

  const matchers = buildHeadingPrefixMatchers(prefix, numericTokens);
  for (const matcher of matchers) {
    const match = trimmed.match(matcher);
    if (match?.[0]) {
      const removeLength = leadingWhitespaceLength + match[0].length;
      removeLeadingCharactersFromHeading(heading, removeLength);
      return (heading.textContent ?? '').trim();
    }
  }

  return rawText.trim();
};

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
  const [showAutoNumbering, setShowAutoNumbering] = useState(false);

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

      const levelCounts: Record<number, number> = {};
      headingElements.forEach((heading) => {
        const level = Number(heading.tagName.substring(1));
        if (!Number.isNaN(level)) {
          levelCounts[level] = (levelCounts[level] ?? 0) + 1;
        }
      });

      const shouldSkipSingleH1 = (levelCounts[1] ?? 0) === 1;
      const targetHeadings = shouldSkipSingleH1
        ? headingElements.filter((heading) => heading.tagName.toUpperCase() !== 'H1')
        : headingElements;

      if (!targetHeadings.length) {
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

      const minLevel = targetHeadings.reduce((min, h) => {
        const level = Number(h.tagName.substring(1));
        return Number.isNaN(level) ? min : Math.min(min, level);
      }, 6);
      const counters: number[] = [0, 0, 0, 0, 0, 0];

      const generatedItems = targetHeadings
        .map((heading, index) => {
          const originalHtmlAttr = heading.getAttribute('data-heading-original-html');
          if (originalHtmlAttr) {
            if (heading.innerHTML !== originalHtmlAttr) {
              heading.innerHTML = originalHtmlAttr;
            }
          } else {
            heading.setAttribute('data-heading-original-html', heading.innerHTML);
          }

          const rawText = heading.textContent?.trim() ?? '';
          if (!rawText) {
            return null;
          }

          const level = Number(heading.tagName.substring(1));
          const relativeLevel = level - minLevel;

          // Reset deeper levels
          for (let i = relativeLevel + 1; i < counters.length; i++) {
            counters[i] = 0;
          }
          // Increment current level
          if (relativeLevel >= 0 && relativeLevel < counters.length) {
            counters[relativeLevel] = (counters[relativeLevel] || 0) + 1;
          }

          let prefix = '';
          if (relativeLevel === 0) {
            prefix = `${toChineseNumeral(counters[0] || 0)}、`;
          } else if (relativeLevel === 1) {
            prefix = `${counters[1] || 0}`;
          } else if (relativeLevel >= 2) {
            const parts = [];
            for (let i = 1; i <= relativeLevel; i++) {
              parts.push(counters[i] || 0);
            }
            prefix = parts.join('.');
          }

          const existingId = heading.id.trim();
          const id = existingId || mapHeadingToId(rawText, index);
          heading.id = id;
          heading.classList.add('scroll-mt-24');
          let headingText = rawText;

          if (showAutoNumbering) {
            const numericTokens =
              relativeLevel === 0
                ? [counters[0] || 0]
                : counters.slice(1, relativeLevel + 1).map((value) => value || 0);
            heading.setAttribute('data-heading-prefix', prefix);
            headingText = stripExistingHeadingNumbering(heading, rawText, prefix, numericTokens);
          } else {
            heading.removeAttribute('data-heading-prefix');
          }

          return { id, text: headingText, level, prefix } satisfies TocItem;
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
  }, [articleContent, showAutoNumbering]);

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

  // Get bound character info if this is a game strategy article
  const boundCharacter = article.character_id ? characters[article.character_id] : null;

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
    <div className={`container mx-auto ${isMobile ? 'px-1 py-2' : 'px-6 py-8'} max-w-6xl`}>
      <div className='flex flex-col lg:flex-row lg:items-start lg:gap-10'>
        {hasToc && (
          <aside className='sticky top-24 hidden h-max max-h-[75vh] overflow-auto rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur lg:block lg:w-64 dark:border-gray-700 dark:bg-gray-900/40'>
            {renderTocList('text-left')}
          </aside>
        )}

        <div className='flex-1'>
          {/* Header */}
          <div className='mb-8 flex flex-col'>
            <header className='text-center'>
              <h1 className={`${titleSize} py-3 font-bold text-blue-600 dark:text-blue-400`}>
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

                {boundCharacter && (
                  <Link
                    href={`/characters/${encodeURIComponent(boundCharacter.id)}`}
                    className='flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                  >
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
                    <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                      查看{boundCharacter.id}详情
                    </span>
                  </Link>
                )}

                <div className='flex items-center gap-2'>
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  <span>创建于: {formatArticleDate(article.created_at)}</span>
                </div>

                <div className='flex items-center gap-2'>
                  <EyeIcon className='size-4' strokeWidth={1.5} />

                  <span>浏览: {article.view_count ?? 0}</span>
                </div>

                {article.latest_version && (
                  <div className='flex items-center gap-2'>
                    <PencilSquareIcon className='size-4' strokeWidth={1.5} />

                    <span>
                      最后编辑: {formatArticleDate(article.latest_version.created_at!)}
                      {article.latest_version.users_public_view?.nickname &&
                        ` 由 ${article.latest_version.users_public_view.nickname}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='mt-4 flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700'>
                <button
                  onClick={() => setShowAutoNumbering(!showAutoNumbering)}
                  type='button'
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                    showAutoNumbering
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {showAutoNumbering ? '隐藏编号' : '自动编号'}
                </button>

                <Link
                  href={`/articles/${articleId}/history`}
                  className='inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  <ClockIcon className='size-4' strokeWidth={1.5} />
                  历史版本
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
            <div className='mb-6 rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm lg:hidden dark:border-gray-700 dark:bg-gray-900/40'>
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
            className={clsx(
              'article-content',
              !isMobile &&
                'rounded-lg border border-transparent p-0 lg:bg-white/70 lg:p-8 lg:shadow-sm dark:lg:border-gray-800 dark:lg:bg-gray-900/40',
              showAutoNumbering && 'article-content-auto-numbered'
            )}
          >
            <style jsx global>{`
              .article-content-auto-numbered [data-heading-prefix]::before {
                content: attr(data-heading-prefix) ' ';
                margin-right: 0.5em;
                font-weight: normal;
                opacity: 0.8;
              }
            `}</style>
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
