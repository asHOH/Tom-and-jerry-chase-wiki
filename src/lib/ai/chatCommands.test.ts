import { conversationMarkdown, getComposerTrigger, replaceComposerTrigger } from './chatCommands';

it('recognizes caret-local references and slash commands without treating emails or selected references as searches', () => {
  expect(getComposerTrigger('请比较@汤姆 与杰瑞', 6)).toEqual({
    type: 'reference',
    query: '汤姆',
    start: 3,
    end: 6,
  });
  expect(getComposerTrigger('/ret', 4)).toMatchObject({ type: 'command', query: 'ret' });
  expect(getComposerTrigger('a@b.com', 7)).toBeNull();
  expect(getComposerTrigger('@角色「汤姆」', 7)).toBeNull();
  expect(getComposerTrigger('路径 /help', 8)).toBeNull();
});

it('replaces only the active query and preserves the remainder and caret', () => {
  const text = '请比较 @汤姆 与杰瑞';
  const trigger = getComposerTrigger(text, 7)!;
  expect(replaceComposerTrigger(text, trigger, '@角色「汤姆」')).toEqual({
    text: '请比较 @角色「汤姆」  与杰瑞',
    caret: 12,
  });
});

it('exports visible conversation text without tool payloads or reasoning', () => {
  const markdown = conversationMarkdown([
    { id: 'u', role: 'user', parts: [{ type: 'text', text: '@角色「汤姆」' }] },
    {
      id: 'a',
      role: 'assistant',
      parts: [
        { type: 'reasoning', text: 'hidden' },
        { type: 'text', text: '角色介绍' },
      ],
    },
  ]);
  expect(markdown).toContain('### 你\n\n@角色「汤姆」');
  expect(markdown).toContain('### Chase · AI 助手\n\n角色介绍');
  expect(markdown).not.toContain('hidden');
});
