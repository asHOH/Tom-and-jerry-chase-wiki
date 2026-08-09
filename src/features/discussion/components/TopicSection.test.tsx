import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { CommentNode } from '../types';
import { TopicSection } from './TopicSection';

const topic: CommentNode = {
  id: 'topic-1',
  parentId: null,
  content: '主题内容',
  createdAt: '2026-08-10T00:00:00.000Z',
  title: '测试主题',
  status: 'visible',
  author: { id: 'user-1', nickname: '汤姆' },
  depth: 0,
  children: [
    {
      id: 'reply-1',
      parentId: 'topic-1',
      content: '已有回复',
      createdAt: '2026-08-10T01:00:00.000Z',
      title: null,
      status: 'visible',
      author: { id: 'user-2', nickname: '杰瑞' },
      depth: 1,
      children: [],
    },
  ],
};

describe('TopicSection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it('uses ReplyForm to submit a nested reply', async () => {
    const onMutate = jest.fn();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comment: { id: 'reply-2' } }),
    } as Response);
    global.fetch = fetchMock;

    render(
      <TopicSection
        topic={topic}
        scope='characters'
        targetId='汤姆'
        isAdmin={false}
        isAuthenticated
        userNickname='测试用户'
        onMutate={onMutate}
        onLoginRequired={jest.fn()}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: '回复' })[1]!);

    expect(screen.getByText('回复 杰瑞')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('写下你的回复…'), {
      target: { value: '新的嵌套回复' },
    });
    fireEvent.click(screen.getByRole('button', { name: '发表回复' }));

    await waitFor(() => expect(onMutate).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'characters',
        targetId: '汤姆',
        parentId: 'reply-1',
        content: '新的嵌套回复',
      }),
    });
    expect(screen.queryByPlaceholderText('写下你的回复…')).not.toBeInTheDocument();
  });
});
