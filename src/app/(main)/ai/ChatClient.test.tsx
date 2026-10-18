import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { useAuthenticatedUserId } from '@/hooks/useAuthenticatedUserId';
import { useChat } from '@/hooks/useChat';
import * as baseline from '@/data/static';
import { replaceChatInputText } from '@/testUtils/chatInput';

import ChatClient from './ChatClient';

jest.mock('@/hooks/useAuthenticatedUserId', () => ({ useAuthenticatedUserId: jest.fn() }));
jest.mock('@/hooks/useSearchGameData', () => ({ useSearchGameData: () => baseline }));
jest.mock('@/hooks/useChat', () => ({ useChat: jest.fn() }));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));
const mockSend = jest.fn(async () => true);
const mockStop = jest.fn();
const mockRetry = jest.fn();
const mockClear = jest.fn();
const chatState: ReturnType<typeof useChat> = {
  messages: [],
  ready: true,
  notice: null,
  contextTruncated: false,
  isLoading: false,
  stopped: false,
  error: null,
  send: mockSend,
  stop: mockStop,
  retry: mockRetry,
  clear: mockClear,
};

beforeEach(() => {
  jest.mocked(useAuthenticatedUserId).mockReturnValue({ userId: 'account-a', isLoading: false });
  jest.mocked(useChat).mockReturnValue({ ...chatState });
  mockSend.mockResolvedValue(true);
});

it('sends explicitly, supports Shift+Enter, and waits for Chinese composition', () => {
  render(<ChatClient userId='account-a' available />);
  const input = screen.getByRole('textbox', { name: '你的问题' });
  replaceChatInputText(input, '汤姆的技能');
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(mockSend).toHaveBeenCalledWith('汤姆的技能');
  expect(input.textContent).toBe('');
});

it('keeps readable text while skipping raw HTML, with retry and clear actions', async () => {
  jest.mocked(useChat).mockReturnValue({
    ...chatState,
    messages: [
      { id: 'u', role: 'user', parts: [{ type: 'text', text: '汤姆' }] },
      {
        id: 'a',
        role: 'assistant',
        parts: [{ type: 'text', text: '安全内容\n\n<img src=x onerror=alert(1)>' }],
      },
    ],
  });
  render(<ChatClient userId='account-a' available />);
  expect(await screen.findByText('安全内容')).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  const answer = screen.getByRole('article', { name: 'AI 助手的回答' });
  fireEvent.click(within(answer).getByRole('button', { name: '重试回答' }));
  expect(mockRetry).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '清空对话' }));
  expect(mockClear).toHaveBeenCalled();
});

it('allows retry when a request ends before an assistant answer is available', () => {
  jest.mocked(useChat).mockReturnValue({
    ...chatState,
    error: '请求失败',
    messages: [{ id: 'u', role: 'user', parts: [{ type: 'text', text: '汤姆' }] }],
  });
  render(<ChatClient userId='account-a' available />);
  fireEvent.click(screen.getByRole('button', { name: '重试回答' }));
  expect(mockRetry).toHaveBeenCalled();
});

it('renders bold CJK text next to Chinese punctuation and characters', async () => {
  jest.mocked(useChat).mockReturnValue({
    ...chatState,
    messages: [
      {
        id: 'a',
        role: 'assistant',
        parts: [{ type: 'text', text: '汤姆的**「手型枪」**技能。' }],
      },
    ],
  });
  render(<ChatClient userId='account-a' available />);
  const answer = screen.getByRole('article', { name: 'AI 助手的回答' });
  expect(await within(answer).findByText('「手型枪」')).toHaveAttribute(
    'data-streamdown',
    'strong'
  );
});

it('disables sends and clears during streaming, with a stop action', () => {
  jest.mocked(useChat).mockReturnValue({ ...chatState, isLoading: true });
  render(<ChatClient userId='account-a' available />);
  replaceChatInputText(screen.getByRole('textbox'), '追问');
  expect(screen.queryByRole('button', { name: '发送' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '清空对话' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(mockSend).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '停止回答' }));
  expect(mockStop).toHaveBeenCalled();
});

it('hides the composer while restoring history and when identity changes', () => {
  jest.mocked(useChat).mockReturnValue({ ...chatState, ready: false });
  const { rerender } = render(<ChatClient userId='account-a' available />);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  jest.mocked(useChat).mockReturnValue({ ...chatState });
  rerender(<ChatClient userId='account-a' available />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  jest.mocked(useAuthenticatedUserId).mockReturnValue({ userId: 'account-b', isLoading: false });
  rerender(<ChatClient userId='account-a' available />);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByText(/登录状态已改变/)).toBeInTheDocument();
});

it('shows unavailable configuration and bounded-context notices', () => {
  const { rerender } = render(<ChatClient userId='account-a' available={false} />);
  expect(screen.getByText(/暂时不可用/)).toBeInTheDocument();
  expect(useChat).not.toHaveBeenCalled();
  jest.mocked(useChat).mockReturnValue({ ...chatState, contextTruncated: true });
  rerender(<ChatClient userId='account-a' available />);
  expect(screen.getByText(/完整记录仍保存在本地/)).toBeInTheDocument();
});

it('keeps references available without a sidebar or automatic submission', () => {
  render(<ChatClient userId='account-a' available />);
  replaceChatInputText(screen.getByRole('textbox'), '详细解释 @角色「汤姆」 的技能与使用技巧。');
  expect(screen.getByRole('textbox').querySelector('[data-chat-mention]')).toHaveAttribute(
    'data-chat-mention',
    '@角色「汤姆」'
  );
  expect(mockSend).not.toHaveBeenCalled();
  expect(screen.queryByRole('complementary', { name: '对话侧边栏' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '返回百科' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('button', { name: '移除引用 汤姆' })).toBeInTheDocument();
  for (const name of ['快捷键与命令', '导出对话', '引用面板']) {
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  }
});

it('runs local slash commands and leaves custom prompts to ordinary messages', () => {
  render(<ChatClient userId='account-a' available />);
  const input = screen.getByRole('textbox');
  replaceChatInputText(input, '/help');
  fireEvent.click(screen.getByRole('button', { name: '发送' }));
  expect(screen.getByRole('region', { name: '命令帮助' })).toBeInTheDocument();
  expect(mockSend).not.toHaveBeenCalled();
  replaceChatInputText(input, '/compare @角色「汤姆」 @角色「杰瑞」');
  fireEvent.click(screen.getByRole('button', { name: '发送' }));
  expect(screen.getByText('未找到命令。输入 / 查看可用命令。')).toBeInTheDocument();
  expect(mockSend).not.toHaveBeenCalled();
  replaceChatInputText(input, '/clear 附加文字');
  fireEvent.click(screen.getByRole('button', { name: '发送' }));
  expect(screen.getByText('此命令不接受参数。')).toBeInTheDocument();
  expect(mockClear).not.toHaveBeenCalled();
  replaceChatInputText(input, '比较 @角色「汤姆」 @角色「杰瑞」');
  fireEvent.click(screen.getByRole('button', { name: '发送' }));
  expect(mockSend).toHaveBeenCalledWith('比较 @角色「汤姆」 @角色「杰瑞」');
});

it('copies answers and exports locally without generating an answer', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const createUrl = jest.fn().mockReturnValue('blob:local-export');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  jest.mocked(useChat).mockReturnValue({
    ...chatState,
    messages: [
      { id: 'u', role: 'user', parts: [{ type: 'text', text: '@角色「汤姆」' }] },
      { id: 'a', role: 'assistant', parts: [{ type: 'text', text: '角色介绍' }] },
    ],
  });
  render(<ChatClient userId='account-a' available />);
  fireEvent.click(screen.getByRole('button', { name: '复制回答' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '已复制回答' })).toBeInTheDocument()
  );
  expect(writeText).toHaveBeenCalledWith('角色介绍');
  replaceChatInputText(screen.getByRole('textbox'), '/export');
  fireEvent.click(screen.getByRole('button', { name: '发送' }));
  expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
  expect(mockSend).not.toHaveBeenCalled();
});
