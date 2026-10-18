import { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { CHAT_MAX_QUESTION_LENGTH } from '@/lib/ai/chatMessages';
import { replaceChatInputText } from '@/testUtils/chatInput';

import ChatMentionInput, { type ChatMentionInputHandle } from './ChatMentionInput';

function Input({
  initial = '',
  inputRef,
}: {
  initial?: string;
  inputRef?: React.Ref<ChatMentionInputHandle>;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <ChatMentionInput
        ref={inputRef}
        value={value}
        onChange={setValue}
        onCaretChange={() => {}}
        menuId={undefined}
        activeOptionId={undefined}
      />
      <output data-testid='canonical'>{value}</output>
    </>
  );
}

it('removes only the chosen occurrence and supports undo and redo as separate actions', () => {
  render(<Input initial='比较 @角色「汤姆」 和 @角色「汤姆」 的搭配' />);
  const input = screen.getByRole('textbox');
  fireEvent.click(screen.getAllByRole('button', { name: '移除引用 汤姆' })[1]!);
  expect(screen.getByTestId('canonical').textContent).toBe('比较 @角色「汤姆」 和  的搭配');
  expect(input.querySelectorAll('[data-chat-mention]')).toHaveLength(1);
  fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
  expect(input.querySelectorAll('[data-chat-mention]')).toHaveLength(2);
  fireEvent.keyDown(input, { key: 'z', ctrlKey: true, shiftKey: true });
  expect(input.querySelectorAll('[data-chat-mention]')).toHaveLength(1);
});

it('deletes whole chips with Backspace and Delete and preserves the surrounding text', () => {
  const inputRef = createRef<ChatMentionInputHandle>();
  render(<Input initial='前 @角色「汤姆」 后' inputRef={inputRef} />);
  const input = screen.getByRole('textbox');
  act(() => {
    inputRef.current!.focus();
    inputRef.current!.setSelectionRange('前 @角色「汤姆」'.length, '前 @角色「汤姆」'.length);
  });
  fireEvent.keyDown(input, { key: 'Backspace' });
  expect(screen.getByTestId('canonical').textContent).toBe('前  后');
  fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
  act(() => inputRef.current!.setSelectionRange(2, 2));
  fireEvent.keyDown(input, { key: 'Delete' });
  expect(screen.getByTestId('canonical').textContent).toBe('前  后');
});

it('pastes plain text safely, preserves newlines and canonical references on copy, and limits input', () => {
  render(<Input />);
  const input = screen.getByRole('textbox');
  const text = '<img src=x onerror=alert(1)>\n@技能「汤姆/发怒冲刺」';
  replaceChatInputText(input, text);
  expect(input.querySelector('img[src], img[onerror]')).toBeNull();
  expect(input).toHaveTextContent('<img src=x onerror=alert(1)>');
  expect(input.querySelector('[data-chat-mention]')).toHaveAttribute('contenteditable', 'false');
  expect(screen.getByTestId('canonical').textContent).toBe(text);
  fireEvent.keyDown(input, { key: 'a', ctrlKey: true });
  const setData = jest.fn();
  fireEvent.copy(input, { clipboardData: { setData, clearData: jest.fn() } });
  expect(setData).toHaveBeenCalledWith('text/plain', text);
  replaceChatInputText(input, '中'.repeat(CHAT_MAX_QUESTION_LENGTH + 20));
  expect(screen.getByTestId('canonical').textContent).toHaveLength(CHAT_MAX_QUESTION_LENGTH);
});
