'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { toChineseNumeral } from '@/lib/textUtils';

export type ArticleTocItem = {
  id: string;
  text: string;
  level: number;
  prefix: string;
};

type UseArticleTocOptions = {
  articleId: string;
  content: string;
  showAutoNumbering: boolean;
};

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

export function useArticleToc({ articleId, content, showAutoNumbering }: UseArticleTocOptions) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledArticleRef = useRef<string | null>(null);
  const [tocItems, setTocItems] = useState<ArticleTocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState('');

  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container) {
      setTocItems([]);
      return;
    }

    let isIterating = false;
    let isDisposed = false;
    let observer: MutationObserver | null = null;

    const generateTocItems = () => {
      if (isIterating || isDisposed) return;
      isIterating = true;
      observer?.disconnect();

      try {
        const headingElements = Array.from(
          container.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6')
        );

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
          setTocItems((previousItems) => (previousItems.length ? [] : previousItems));
          setActiveHeadingId((previousId) => (previousId ? '' : previousId));
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

        const minLevel = targetHeadings.reduce((minimum, heading) => {
          const level = Number(heading.tagName.substring(1));
          return Number.isNaN(level) ? minimum : Math.min(minimum, level);
        }, 6);
        const counters: number[] = [0, 0, 0, 0, 0, 0];

        const generatedItems = targetHeadings
          .map((heading, index) => {
            const originalHtml = heading.getAttribute('data-heading-original-html');
            if (originalHtml) {
              if (heading.innerHTML !== originalHtml) {
                heading.innerHTML = originalHtml;
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

            for (let i = relativeLevel + 1; i < counters.length; i++) {
              counters[i] = 0;
            }
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

            return { id, text: headingText, level, prefix } satisfies ArticleTocItem;
          })
          .filter((item): item is ArticleTocItem => Boolean(item));

        setTocItems((previousItems) => {
          if (
            previousItems.length === generatedItems.length &&
            previousItems.every((item, index) => {
              const nextItem = generatedItems[index];
              return (
                nextItem !== undefined &&
                item.id === nextItem.id &&
                item.text === nextItem.text &&
                item.level === nextItem.level &&
                item.prefix === nextItem.prefix
              );
            })
          ) {
            return previousItems;
          }
          return generatedItems;
        });

        setActiveHeadingId((previousId) =>
          previousId && generatedItems.some((item) => item.id === previousId)
            ? previousId
            : (generatedItems[0]?.id ?? '')
        );
      } finally {
        isIterating = false;
        if (!isDisposed) {
          observer?.observe(container, { childList: true, subtree: true, characterData: true });
        }
      }
    };

    observer = new MutationObserver(generateTocItems);
    generateTocItems();

    return () => {
      isDisposed = true;
      observer?.disconnect();
    };
  }, [articleId, content, showAutoNumbering]);

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

      setActiveHeadingId((previousId) => (previousId === currentId ? previousId : currentId));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (
      hasScrolledArticleRef.current !== articleId &&
      tocItems.length > 0 &&
      window.location.hash
    ) {
      const hashId = decodeURIComponent(window.location.hash.substring(1));
      if (tocItems.some((item) => item.id === hashId)) {
        const element = document.getElementById(hashId);
        if (element) {
          hasScrolledArticleRef.current = articleId;
          timer = setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [articleId, tocItems]);

  return { contentRef, tocItems, activeHeadingId };
}
