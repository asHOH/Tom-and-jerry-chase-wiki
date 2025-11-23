import { memo, useLayoutEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { sanitizeHTML } from '@/lib/xssUtils';

function extractPlainTextPreview(html: string): string {
  let text = html
    .replace(/<\/(p|div|section|article|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]*>/g, '');

  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  text = text.replace(/&[a-z]+;|&#\d+;/gi, (match) => {
    return entities[match.toLowerCase()] || match;
  });

  text = text.replace(/[\r\n]+/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export default memo(function RichTextDisplay({
  content,
  preview = false,
}: {
  content: string | null | undefined;
  preview?: boolean;
}) {
  // For preview mode, compute text directly (SSR-friendly, no side effects)
  const plainText = useMemo(
    () => extractPlainTextPreview(content ?? '<p>内容加载中...</p>'),
    [content]
  );

  // For full display mode, use client-side sanitization
  const [sanitizedHTML, setSanitizedHTML] = useState('<p>内容加载中...</p>');
  useLayoutEffect(() => {
    if (!preview) {
      setSanitizedHTML(sanitizeHTML(content ?? '<p>内容加载中...</p>'));
    }
  }, [content, preview]);

  if (preview) {
    return <div className='mt-1 mb-3 line-clamp-3 text-sm'>{plainText}</div>;
  }

  return (
    <div
      className={clsx(
        `prose prose-lg dark:prose-invert prose-blue prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-3 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300 max-w-none`
      )}
      dangerouslySetInnerHTML={{
        __html: sanitizedHTML,
      }}
    />
  );
});
