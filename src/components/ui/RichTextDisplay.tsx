import { memo, useMemo } from 'react';
import { sanitizeHTML } from '@/lib/xssUtils';
import clsx from 'clsx';

export default memo(function RichTextDisplay({
  content,
  preview = false,
}: {
  content: string | null | undefined;
  preview?: boolean;
}) {
  const sanitizedHTML = useMemo(() => {
    const sanitizedHTML = sanitizeHTML(content ?? '<p>内容加载中...</p>');
    if (!preview) return sanitizedHTML;
    const fragment = document.createElement('div');
    // const fragment = document.createDocumentFragment();
    fragment.innerHTML = sanitizedHTML;
    return fragment.innerText;
  }, [content, preview]);
  return (
    <div
      className={clsx(
        !preview &&
          `prose prose-lg max-w-none dark:prose-invert prose-blue
          prose-headings:text-gray-900 dark:prose-headings:text-gray-100
          prose-p:text-gray-700 dark:prose-p:text-gray-300
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
          prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:text-gray-700 dark:prose-li:text-gray-300
        `,
        preview && 'line-clamp-3 text-sm mt-1 mb-3'
      )}
      dangerouslySetInnerHTML={{
        __html: sanitizedHTML,
      }}
    />
  );
});
