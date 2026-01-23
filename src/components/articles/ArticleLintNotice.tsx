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

  const grouped = results.reduce<Record<ArticleLintSeverity, ArticleLintResult[]>>(
    (acc, cur) => {
      acc[cur.severity].push(cur);
      return acc;
    },
    { error: [], warning: [] }
  );

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
                    {item.id === 'no-h1' && onFixHeadings && (
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

  // Warning: overly long section headings (H2-H4) in content (limit ~12 汉字 / 24 ASCII)
  const headingRegex = /<\s*h([2-4])[^>]*>([\s\S]*?)<\/\s*h\1\s*>/gi;
  const HEADING_LENGTH_LIMIT = 24;
  let headingMatch: RegExpExecArray | null;
  let headingIndex = 0;
  while ((headingMatch = headingRegex.exec(content))) {
    headingIndex += 1;
    const level = headingMatch?.[1];
    const rawHeading = headingMatch?.[2] ?? '';
    if (!rawHeading || !level) continue;
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

  return results;
};
