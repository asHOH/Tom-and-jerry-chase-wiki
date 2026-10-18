import type { UIMessage } from 'ai';

import { toChatTextMessages } from './chatMessages';

export const CHAT_COMMANDS = [
  { id: 'retry', label: '重新回答', description: '重新生成最后一个问题的回答', hint: '对话操作' },
  {
    id: 'export',
    label: '导出对话',
    description: '将当前对话下载为 Markdown 文件',
    hint: '本地文件',
  },
  {
    id: 'clear',
    label: '清空对话',
    description: '清空当前账号在此浏览器中的对话',
    hint: '对话操作',
  },
  {
    id: 'help',
    label: '快捷键与命令',
    description: '查看引用、命令和键盘操作说明',
    hint: '使用帮助',
  },
] as const;

export type ChatCommand = (typeof CHAT_COMMANDS)[number];
export type ComposerTrigger = {
  type: 'reference' | 'command';
  query: string;
  start: number;
  end: number;
};

export function getComposerTrigger(text: string, caret: number): ComposerTrigger | null {
  const prefix = text.slice(0, caret);
  const mention = /(^|[^a-zA-Z0-9_])@([^\s@「」]{0,40})$/u.exec(prefix);
  if (mention)
    return {
      type: 'reference',
      query: mention[2]!,
      start: prefix.length - mention[2]!.length - 1,
      end: caret,
    };
  const command = /^\s*\/([a-z]*)$/i.exec(prefix);
  if (command)
    return { type: 'command', query: command[1]!, start: prefix.indexOf('/'), end: caret };
  return null;
}

export function replaceComposerTrigger(
  text: string,
  trigger: ComposerTrigger,
  replacement: string
) {
  const inserted = `${replacement} `;
  return {
    text: text.slice(0, trigger.start) + inserted + text.slice(trigger.end),
    caret: trigger.start + inserted.length,
  };
}

export function conversationMarkdown(messages: readonly UIMessage[]): string {
  return (
    '# 猫鼠百科 · AI 对话\n\n' +
    toChatTextMessages(messages)
      .map(
        (message) =>
          `### ${message.role === 'user' ? '你' : 'Chase · AI 助手'}\n\n${message.parts[0]?.text ?? ''}`
      )
      .join('\n\n---\n\n') +
    '\n'
  );
}
