import React from 'react';
import clsx from 'clsx';

export type ArticleLintSeverity = 'error' | 'warning';

export interface ArticleLintResult {
  id: string;
  severity: ArticleLintSeverity;
  message: string;
}

interface ArticleLintNoticeProps {
  results: ArticleLintResult[];
  onFixHeadings?: () => void;
}

const severityStyles: Record<ArticleLintSeverity, { container: string }> = {
  error: {
    container:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-900/15 dark:text-red-200',
  },
  warning: {
    container:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/15 dark:text-amber-200',
  },
};

export const ArticleLintNotice: React.FC<ArticleLintNoticeProps> = ({ results, onFixHeadings }) => {
  if (!results.length) return null;

  const grouped: Record<ArticleLintSeverity, ArticleLintResult[]> = { error: [], warning: [] };
  results.forEach((item) => {
    if (item.severity === 'error' || item.severity === 'warning') {
      grouped[item.severity].push(item);
    }
  });

  if (!grouped.error.length && !grouped.warning.length) return null;

  return (
    <div className='space-y-3'>
      {(['error', 'warning'] as ArticleLintSeverity[]).map((severity) => {
        const items = grouped[severity];
        if (!items.length) return null;
        const styles = severityStyles[severity];
        return (
          <div
            key={severity}
            className={clsx('rounded-lg border px-4 py-3 text-sm', styles.container)}
            role={severity === 'error' ? 'alert' : 'status'}
            aria-live={severity === 'error' ? 'assertive' : 'polite'}
          >
            <div className='space-y-1'>
              {items.map((item) => (
                <div key={item.id} className='leading-relaxed'>
                  <div className='flex items-start gap-2'>
                    <span className='flex-1'>{item.message}</span>
                    {(item.id === 'no-h1' || item.id.startsWith('heading-order')) &&
                      onFixHeadings && (
                        <button
                          type='button'
                          onClick={onFixHeadings}
                          className='shrink-0 rounded border border-current px-2 py-1 text-xs font-semibold transition hover:bg-white/20'
                        >
                          一键修复
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const getArticleLintResults = (title: string, content: string): ArticleLintResult[] => {
  const results: ArticleLintResult[] = [];

  // Error: forbid H1 headings inside article content
  if (/<\s*h1(\s|>)/i.test(content)) {
    results.push({
      id: 'no-h1',
      severity: 'error',
      message: '禁用一级标题（H1）。正文应从二级标题（H2）开始。',
    });
  }

  // Warning: title too long (counting ASCII=1, non-ASCII=2). Threshold ~40 units (~20 汉字 / 40 ASCII)
  const titleLengthUnits = Array.from(title || '').reduce((len, ch) => {
    return len + (ch.charCodeAt(0) <= 0x7f ? 1 : 2);
  }, 0);
  const TITLE_LENGTH_LIMIT = 40;
  if (titleLengthUnits > TITLE_LENGTH_LIMIT) {
    results.push({
      id: 'title-too-long',
      severity: 'warning',
      message: `文章标题偏长（约 ${titleLengthUnits} 字符）。建议控制在 20 个汉字或 40 个英文字符内。`,
    });
  }

  // Warning: overly long section headings (H2-H6) in content (limit ~12 汉字 / 24 ASCII)
  const headingRegex = /<\s*h([2-6])[^>]*>([\s\S]*?)<\/\s*h\1\s*>/gi;
  const HEADING_LENGTH_LIMIT = 24;
  let headingMatch: RegExpExecArray | null;
  let headingIndex = 0;
  const headingLevels: number[] = [];
  while ((headingMatch = headingRegex.exec(content))) {
    headingIndex += 1;
    const level = headingMatch?.[1];
    const rawHeading = headingMatch?.[2] ?? '';
    if (!rawHeading || !level) continue;
    headingLevels.push(Number(level));
    const headingText = rawHeading
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (!headingText) continue;

    const headingUnits = Array.from(headingText).reduce((len, ch) => {
      return len + (ch.charCodeAt(0) <= 0x7f ? 1 : 2);
    }, 0);

    if (headingUnits > HEADING_LENGTH_LIMIT) {
      results.push({
        id: `h${level}-too-long-${headingIndex}`,
        severity: 'warning',
        message: `H${level} 标题偏长（约 ${headingUnits} 字符）。建议控制在 12 个汉字或 24 个英文字符内。`,
      });
    }
  }

  // Warning: heading order/skip (e.g., H2 -> H4) and starting below H2
  if (headingLevels.length) {
    const [firstLevel] = headingLevels;
    if (firstLevel !== undefined && firstLevel > 2) {
      results.push({
        id: 'heading-order-start',
        severity: 'warning',
        message: `首个标题应为 H2，当前为 H${firstLevel}。请从 H2 开始正文。`,
      });
    }

    for (let i = 1; i < headingLevels.length; i += 1) {
      const prev = headingLevels[i - 1];
      const current = headingLevels[i];
      if (typeof prev !== 'number' || typeof current !== 'number') continue;
      if (current > prev + 1) {
        results.push({
          id: `heading-order-skip-${i + 1}`,
          severity: 'warning',
          message: `标题层级跳级：H${prev} → H${current}。建议使用 H${prev + 1}。`,
        });
        break;
      }
    }
  }

  // Warning: inline style attribute usage
  if (/\sstyle\s*=\s*(['"]).*?\1/i.test(content)) {
    results.push({
      id: 'inline-style',
      severity: 'warning',
      message: '检测到内联样式（style=）。请移除内联样式，使用编辑器提供的格式或全局样式。',
    });
  }

  // Error: forbidden blocks/tags
  const forbiddenTags = Array.from(content.matchAll(/<(script|iframe|object|embed|style)\b/gi)).map(
    (match) => match[1]?.toLowerCase() ?? ''
  );
  if (forbiddenTags.length) {
    const uniqueTags = Array.from(new Set(forbiddenTags));
    results.push({
      id: 'forbidden-blocks',
      severity: 'error',
      message: `检测到禁止的嵌入或脚本标签：${uniqueTags.join(', ')}。请移除后再提交。`,
    });
  }

  return results;
};
