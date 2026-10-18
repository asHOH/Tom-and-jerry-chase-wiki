import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ChatReference } from '@/lib/ai/chatReferences';
import { replaceChatInputText } from '@/testUtils/chatInput';

import ChatComposer from './ChatComposer';

const catalog: ChatReference[] = [
  {
    key: '角色:汤姆',
    label: '角色',
    id: '汤姆',
    name: '汤姆',
    aliases: ['大猫'],
    href: '/characters/tom/',
  },
  {
    key: '知识卡:击晕',
    label: '知识卡',
    id: '击晕',
    name: '击晕',
    aliases: [],
    href: '/cards/stun/',
  },
  {
    key: '技能:汤姆/发怒冲刺',
    label: '技能',
    id: '汤姆/发怒冲刺',
    name: '汤姆 · 发怒冲刺',
    aliases: [],
    href: '/characters/tom/#Skill:发怒冲刺',
  },
];
const onSubmit = jest.fn();
const onCommand = jest.fn();
const onStop = jest.fn();

function Composer({
  initial = '',
  isLoading = false,
  hasMessages = true,
}: {
  initial?: string;
  isLoading?: boolean;
  hasMessages?: boolean;
}) {
  const [question, setQuestion] = useState(initial);
  return (
    <ChatComposer
      question={question}
      onChange={setQuestion}
      catalog={catalog}
      onSubmit={onSubmit}
      onCommand={onCommand}
      isLoading={isLoading}
      hasMessages={hasMessages}
      onStop={onStop}
    />
  );
}

it('selects and removes canonical references with the keyboard without sending', async () => {
  render(<Composer />);
  const input = screen.getByRole('textbox');
  replaceChatInputText(input, '@汤');
  await screen.findByRole('option', { name: '汤姆 角色' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input.querySelector('[data-chat-mention]')).toHaveAttribute(
    'data-chat-mention',
    '@角色「汤姆」'
  );
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.paste(input, { clipboardData: { getData: () => '的技能' } });
  expect(input).toHaveTextContent('@汤姆× 的技能');
  fireEvent.click(screen.getByRole('button', { name: '移除引用 汤姆' }));
  expect(input.textContent?.trim()).toBe('的技能');
});

it('filters by type and supports alias searches', async () => {
  render(<Composer />);
  const input = screen.getByRole('textbox');
  replaceChatInputText(input, '@');
  await screen.findByRole('option', { name: '击晕 知识卡' });
  fireEvent.click(screen.getByRole('button', { name: /^知识卡$/ }));
  await waitFor(() =>
    expect(screen.queryByRole('option', { name: '汤姆 角色' })).not.toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: '全部' }));
  replaceChatInputText(input, '@大猫');
  await screen.findByRole('option', { name: '汤姆 角色' });
});

it('offers the expanded data types and inserts an exact character skill reference', async () => {
  render(<Composer />);
  replaceChatInputText(screen.getByRole('textbox'), '@');
  for (const name of [
    '技能',
    '衍生物',
    '组件',
    '模式',
    '特性',
    '组合',
    '猫特技',
    '鼠特技',
    '猫成就',
    '鼠成就',
  ]) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button', { name: '技能' }));
  fireEvent.click(await screen.findByRole('option', { name: '汤姆 · 发怒冲刺 技能' }));
  expect(screen.getByRole('textbox').querySelector('[data-chat-mention]')).toHaveAttribute(
    'data-chat-mention',
    '@技能「汤姆/发怒冲刺」'
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

it('executes slash commands through the palette and preserves an existing draft', () => {
  render(<Composer initial='不要丢失的草稿' />);
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.getByRole('listbox', { name: '斜杠命令' })).toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(4);
  expect(input).toHaveTextContent('不要丢失的草稿');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'retry' }));
  expect(onSubmit).not.toHaveBeenCalled();
});

it('dismisses menus and never selects references while composing Chinese', async () => {
  render(<Composer />);
  const input = screen.getByRole('textbox');
  replaceChatInputText(input, '@汤');
  await screen.findByRole('option', { name: '汤姆 角色' });
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input).toHaveTextContent('@汤');
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('disables history commands during streaming and shows a working stop action', () => {
  render(<Composer initial='/retry' isLoading />);
  expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(onCommand).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '停止回答' }));
  expect(onStop).toHaveBeenCalled();
});

it('allows command selection immediately after a pending mention search', () => {
  render(<Composer />);
  const input = screen.getByRole('textbox');
  replaceChatInputText(input, '@汤');
  replaceChatInputText(input, '/help');
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'help' }));
  expect(onSubmit).not.toHaveBeenCalled();
});
