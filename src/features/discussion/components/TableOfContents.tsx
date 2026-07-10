'use client';

import type { DiscussionTopic } from '../types';

type TableOfContentsProps = {
  topics: DiscussionTopic[];
};

export function TableOfContents({ topics }: TableOfContentsProps) {
  if (topics.length <= 1) return null;

  return (
    <nav
      className='mb-8 rounded-lg border border-gray-200 bg-gray-50/70 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/30'
      aria-label='目录'
    >
      <h2 className='mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200'>目录</h2>
      <ol className='list-decimal space-y-1 pl-5 text-sm'>
        {topics.map((topic) => (
          <li key={topic.id}>
            <a
              href={`#topic-${topic.id}`}
              className='text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
            >
              {topic.title || '（无标题）'}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
