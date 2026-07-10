'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoginDialog from '@/components/LoginDialog';

import { NewTopicForm } from './components/NewTopicForm';
import { TopicList } from './components/TopicList';
import { TopicView } from './components/TopicView';

type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  title: string | null;
  status: string;
  author: {
    id: string;
    nickname: string | null;
  };
};

type CommentsResponse = { comments: ApiComment[] };

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const error = new Error('Failed to fetch') as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

type TalkPageClientProps = {
  scope: string;
  targetId: string;
  entityTitle: string;
};

export function TalkPageClient({ scope, targetId, entityTitle }: TalkPageClientProps) {
  const { role: userRole, nickname: userNickname } = useUser();
  const isMobile = useMobile();

  const [viewMode, setViewMode] = useState<'list' | 'topic'>('list');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const apiUrl = useMemo(
    () =>
      `/api/comments?scope=${encodeURIComponent(scope)}&targetId=${encodeURIComponent(targetId)}`,
    [scope, targetId]
  );

  const {
    data,
    error: loadError,
    mutate,
    isLoading,
  } = useSWR<CommentsResponse>(targetId ? apiUrl : null, fetcher);

  const comments = useMemo(() => data?.comments ?? [], [data]);

  const topics = useMemo(() => {
    return comments
      .filter((c) => c.parent_id === null && c.title)
      .map((topic) => {
        const replies = comments.filter((c) => c.parent_id === topic.id);
        const lastActivity =
          replies.length > 0 ? replies[replies.length - 1]!.created_at : topic.created_at;
        return {
          id: topic.id,
          title: topic.title,
          authorId: topic.author.id,
          authorNickname: topic.author.nickname,
          content: topic.content,
          createdAt: topic.created_at,
          replyCount: replies.length,
          lastActivityAt: lastActivity,
          status: topic.status,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }, [comments]);

  const activeTopic = useMemo(
    () => topics.find((t) => t.id === activeTopicId) ?? null,
    [topics, activeTopicId]
  );

  const handleCreateTopic = useCallback(() => {
    if (!userRole) {
      setShowLoginDialog(true);
      return;
    }
    setShowNewTopicForm(true);
  }, [userRole]);

  const handleTopicClick = useCallback((topicId: string) => {
    setActiveTopicId(topicId);
    setViewMode('topic');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setActiveTopicId(null);
  }, []);

  const handleMutate = useCallback(() => {
    void mutate();
  }, [mutate]);

  // Loading state
  if (isLoading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950'>
        <p className='text-red-600 dark:text-red-400'>讨论加载失败</p>
        <button
          type='button'
          onClick={() => void mutate()}
          className='mt-3 rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-4xl px-4 py-6'>
      {/* Page header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{entityTitle}</h1>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {viewMode === 'topic' ? (
              <button
                type='button'
                onClick={handleBackToList}
                className='hover:text-gray-700 dark:hover:text-gray-300'
              >
                讨论
              </button>
            ) : (
              '讨论'
            )}
            {viewMode === 'topic' && activeTopic?.title ? (
              <>
                <span className='mx-1'>/</span>
                <span className='text-gray-700 dark:text-gray-300'>{activeTopic.title}</span>
              </>
            ) : null}
          </p>
        </div>
        {viewMode === 'list' && (
          <button
            type='button'
            onClick={handleCreateTopic}
            className='rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
          >
            新建话题
          </button>
        )}
        {viewMode === 'topic' && (
          <button
            type='button'
            onClick={handleBackToList}
            className='rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          >
            返回列表
          </button>
        )}
      </div>

      {/* New topic form */}
      {viewMode === 'list' && showNewTopicForm && (
        <NewTopicForm
          scope={scope}
          targetId={targetId}
          onSuccess={() => {
            setShowNewTopicForm(false);
            void mutate();
          }}
          onCancel={() => setShowNewTopicForm(false)}
        />
      )}

      {/* Topic list view */}
      {viewMode === 'list' && (
        <TopicList
          topics={topics}
          onTopicClick={handleTopicClick}
          userRole={userRole}
          userNickname={userNickname}
          onMutate={handleMutate}
        />
      )}

      {/* Topic detail view */}
      {viewMode === 'topic' && activeTopic && (
        <TopicView
          topic={activeTopic}
          comments={comments}
          scope={scope}
          targetId={targetId}
          userRole={userRole}
          userNickname={userNickname}
          onMutate={handleMutate}
        />
      )}

      {showLoginDialog && (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      )}
    </div>
  );
}
