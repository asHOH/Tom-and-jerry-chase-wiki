import { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/design';

export default function StyledMDX({ className, ...props }: ComponentPropsWithRef<'article'>) {
  return (
    <article
      {...props}
      className={cn(
        'prose prose-lg wiki-prose dark:prose-invert hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300 prose-code:px-1.5 prose-blockquote:border-l-blue-500 dark:prose-blockquote:border-l-blue-400 dark:prose-blockquote:bg-slate-800/50 prose-blockquote:rounded-r-lg prose-img:rounded-lg prose-img:shadow-sm prose-hr:border-border prose-p:mb-2 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-h5:text-lg prose-h6:text-base mx-auto p-4 transition-all duration-300 sm:p-6',
        className
      )}
    />
  );
}
