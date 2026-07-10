'use client';

import { formatArticleDate } from '@/lib/dateUtils';

import type { DiscussionTopic } from '../types';

type TopicListProps = {
  topics: DiscussionTopic[];
  onTopicClick: (id: string) => void;
  userRole: string | null;
  userNickname: string | null;
  onMutate: () => void;
};

export function TopicList({
  topics,
  onTopicClick,
  userRole: _userRole,
  userNickname: _userNickname,
  onMutate: _onMutate,
}: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className='rounded-lg border border-gray-200 bg-white/70 p-8 text-center dark:border-gray-700 dark:bg-gray-900/40'>
        <p className='text-gray-500 dark:text-gray-400'>暂无讨论，来创建第一个话题吧</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {topics.map((topic) => (
        <button
          key={topic.id}
          type='button'
          onClick={() => onTopicClick(topic.id)}
          className='w-full rounded-lg border border-gray-200 bg-white/70 p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:bg-gray-800/60'
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h3 className='truncate text-base font-semibold text-gray-900 dark:text-gray-100'>
                {topic.title}
              </h3>
              <div className='mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                <span>{topic.authorNickname || '匿名'}</span>
                <span>{formatArticleDate(topic.createdAt)}</span>
              </div>
            </div>
            <div className='shrink-0 text-right text-xs text-gray-500 dark:text-gray-400'>
              <div>{topic.replyCount} 条回复</div>
              <div className='mt-1'>{formatArticleDate(topic.lastActivityAt)}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
