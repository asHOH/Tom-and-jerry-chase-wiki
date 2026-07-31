'use client';

import Card from '@/components/ui/Card';

import type { DiscussionTopic } from '../types';

type TableOfContentsProps = {
  topics: DiscussionTopic[];
};

export function TableOfContents({ topics }: TableOfContentsProps) {
  if (topics.length <= 1) return null;

  return (
    <Card as='nav' bordered className='mb-8 px-5 py-3' aria-label='目录'>
      <h2 className='mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200'>目录</h2>
      <ol className='list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300'>
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
    </Card>
  );
}
