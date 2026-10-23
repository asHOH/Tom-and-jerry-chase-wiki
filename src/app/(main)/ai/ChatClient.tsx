'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

import { CHAT_COMMANDS, conversationMarkdown, type ChatCommand } from '@/lib/ai/chatCommands';
import { CHAT_MAX_QUESTION_LENGTH, toChatTextMessages } from '@/lib/ai/chatMessages';
import { buildChatReferenceCatalog } from '@/lib/ai/chatReferences';
import { cn } from '@/lib/design';
import { useAuthenticatedUserId } from '@/hooks/useAuthenticatedUserId';
import { useChat } from '@/hooks/useChat';
import { useSearchGameData } from '@/hooks/useSearchGameData';
import { useDarkMode } from '@/context/DarkModeContext';
import ChatComposer from '@/features/ai/components/ChatComposer';
import ChatMessage from '@/features/ai/components/ChatMessage';
import itemGroups from '@/features/items/data/itemGroups';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import Notice from '@/components/ui/Notice';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  CloseIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

const CHAT_GREETINGS = ['今天想了解什么？', '有什么想问的？', '一起研究新玩法吧。'] as const;

const toolButtonClass =
  'flex size-9 shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-black/5 hover:text-stone-900 disabled:opacity-35 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100';

function Conversation({ userId, onUnauthorized }: { userId: string; onUnauthorized: () => void }) {
  const chat = useChat(userId, onUnauthorized);
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const gameData = useSearchGameData(chat.ready);
  const catalog = useMemo(() => buildChatReferenceCatalog(gameData, itemGroups), [gameData]);
  const [greeting] = useState(
    () => CHAT_GREETINGS[Math.floor(Math.random() * CHAT_GREETINGS.length)] ?? CHAT_GREETINGS[0]
  );
  const [question, setQuestion] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [iconRotation, setIconRotation] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const submissionPending = useRef(false);
  const transcript = useMemo(() => toChatTextMessages(chat.messages), [chat.messages]);
  const latestMessage = chat.messages.at(-1);
  const tools =
    latestMessage?.role === 'assistant'
      ? latestMessage.parts.filter(
          (part) => part.type.startsWith('tool-') || part.type === 'dynamic-tool'
        )
      : [];
  const hasText =
    latestMessage?.role === 'assistant' &&
    latestMessage.parts.some((part) => part.type === 'text' && part.text);
  const activity = hasText
    ? '正在生成回答'
    : tools.some(
          (part) =>
            'state' in part &&
            (part.state === 'input-available' || part.state === 'input-streaming')
        )
      ? '正在查阅百科资料'
      : tools.length
        ? '正在整理查询结果'
        : '正在理解问题';

  useEffect(() => {
    const element = scrollRef.current;
    if (element && followLatest.current) element.scrollTop = element.scrollHeight;
  }, [chat.messages, chat.isLoading]);

  useEffect(() => {
    if (showHelp && scrollRef.current) {
      followLatest.current = false;
      scrollRef.current.scrollTop = 0;
    }
  }, [showHelp]);

  const exportConversation = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([conversationMarkdown(chat.messages)], { type: 'text/markdown;charset=utf-8' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = '猫鼠百科-AI对话.md';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback('已生成 Markdown 对话文件。');
    } catch {
      setFeedback('导出失败，请稍后重试。');
    }
  };

  const runCommand = (command: ChatCommand) => {
    if (
      (command.id === 'clear' || command.id === 'retry' || command.id === 'export') &&
      (chat.isLoading || submissionPending.current || !transcript.length)
    ) {
      setFeedback(chat.isLoading ? '请先停止回答，再使用此命令。' : '开始对话后即可使用此命令。');
      return;
    }
    setQuestion((value) => (value.trimStart().startsWith('/') ? '' : value));
    if (command.id === 'clear') {
      chat.clear();
      setQuestion('');
      setFeedback(null);
      followLatest.current = true;
    }
    if (command.id === 'retry') {
      followLatest.current = true;
      void chat.retry();
    }
    if (command.id === 'export') exportConversation();
    if (command.id === 'help') setShowHelp((current) => !current);
  };

  const submit = () => {
    const text = question.trim();
    if (!text || !chat.ready || chat.isLoading || submissionPending.current) return;
    const slash = /^\/([a-z]+)(?:\s+([\s\S]*))?$/i.exec(text);
    if (slash) {
      const command = CHAT_COMMANDS.find((item) => item.id === slash[1]?.toLowerCase());
      if (!command) {
        setFeedback('未找到命令。输入 / 查看可用命令。');
        return;
      }
      if (slash[2]?.trim()) {
        setFeedback('此命令不接受参数。');
        return;
      }
      runCommand(command);
      return;
    }
    if (text.length > CHAT_MAX_QUESTION_LENGTH) {
      setFeedback('问题过长，请缩短后发送。');
      return;
    }
    submissionPending.current = true;
    followLatest.current = true;
    setShowJump(false);
    setQuestion('');
    setFeedback(null);
    void chat.send(text).finally(() => {
      submissionPending.current = false;
    });
  };

  if (!chat.ready) return <LoadingState message='正在恢复本地对话…' />;

  const composer = (
    <ChatComposer
      question={question}
      onChange={setQuestion}
      onSubmit={submit}
      onCommand={runCommand}
      catalog={catalog}
      isLoading={chat.isLoading}
      hasMessages={transcript.length > 0}
      onStop={chat.stop}
    />
  );
  const help = showHelp ? (
    <section
      aria-label='命令帮助'
      className='mx-auto mb-6 max-w-3xl rounded-lg border border-stone-200 p-4 dark:border-neutral-700'
    >
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-sm font-medium'>快捷键与命令</h2>
        <Button
          variant='unstyled'
          aria-label='关闭命令帮助'
          onClick={() => setShowHelp(false)}
          className={toolButtonClass}
        >
          <CloseIcon className='size-4' />
        </Button>
      </div>
      <p className='mb-3 text-xs leading-6 text-stone-500 dark:text-neutral-400'>
        @ 引用资料 · / 命令 · ↑ ↓ 选择 · Enter / Tab 插入 · Esc 关闭 · Shift+Enter 换行 · Ctrl/⌘ K
        打开命令
      </p>
      <div className='grid gap-1 sm:grid-cols-2'>
        {CHAT_COMMANDS.map((command) => (
          <Button
            key={command.id}
            variant='unstyled'
            onClick={() => runCommand(command)}
            className='flex items-center gap-3 rounded-md px-2 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5'
          >
            <code className='w-16 shrink-0 text-stone-500 dark:text-neutral-400'>
              /{command.id}
            </code>
            <span>{command.label}</span>
          </Button>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <section aria-label='Chase 对话工作区' className='relative flex h-full min-h-0 overflow-hidden'>
      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-5'>
          <div className='flex min-w-0 items-center gap-2'>
            <Link href='/' aria-label='返回百科' title='返回百科' className={toolButtonClass}>
              <ChevronLeftIcon className='size-4' />
            </Link>
            <h1 className='sr-only'>百科助手</h1>
          </div>
          <div className='flex shrink-0 items-center gap-0.5'>
            <Button
              variant='unstyled'
              aria-label={isDarkMode ? '切换浅色外观' : '切换深色外观'}
              title='切换外观'
              onClick={toggleDarkMode}
              className={toolButtonClass}
            >
              {isDarkMode ? <SunIcon className='size-4' /> : <MoonIcon className='size-4' />}
            </Button>
            <Button
              variant='unstyled'
              aria-label='清空对话'
              title='新对话'
              disabled={chat.isLoading || !transcript.length}
              onClick={() => runCommand(CHAT_COMMANDS.find((command) => command.id === 'clear')!)}
              className={toolButtonClass}
            >
              <PlusIcon className='size-4' />
            </Button>
          </div>
        </header>
        <div className='relative flex min-h-0 flex-1'>
          <div className='flex min-w-0 flex-1 flex-col'>
            <div
              ref={scrollRef}
              onScroll={() => {
                const element = scrollRef.current;
                if (!element) return;
                followLatest.current =
                  element.scrollHeight - element.scrollTop - element.clientHeight < 80;
                setShowJump(!followLatest.current);
              }}
              className='flex min-h-0 flex-1 [scrollbar-gutter:stable] flex-col overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-10'
            >
              {help}
              <section
                aria-label='对话记录'
                aria-busy={chat.isLoading}
                className={cn(
                  'mx-auto w-full max-w-3xl',
                  transcript.length
                    ? 'space-y-8'
                    : 'flex min-h-0 flex-1 items-center justify-center'
                )}
              >
                {!transcript.length && !showHelp ? (
                  <div className='flex flex-col items-center gap-4'>
                    <Button
                      variant='unstyled'
                      aria-label='旋转百科图标'
                      title='转一圈'
                      onClick={() => setIconRotation((rotation) => rotation + 360)}
                      className='group size-14 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4'
                    >
                      <Image
                        src='/images/mouseSkills/朵朵2-能源装置.png'
                        alt='猫鼠百科'
                        width={56}
                        height={56}
                        unoptimized
                        className='size-14 opacity-70 transition-[transform,filter] duration-500 group-hover:brightness-125 group-focus-visible:brightness-125 motion-reduce:transition-none'
                        style={{ transform: `rotate(${iconRotation}deg)` }}
                      />
                    </Button>
                    <h2 className='text-xl font-medium tracking-tight sm:text-2xl'>{greeting}</h2>
                  </div>
                ) : (
                  transcript.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      streaming={chat.isLoading && message.id === latestMessage?.id}
                      onRetry={
                        !chat.isLoading && index === transcript.length - 1
                          ? () =>
                              runCommand(CHAT_COMMANDS.find((command) => command.id === 'retry')!)
                          : undefined
                      }
                    />
                  ))
                )}
              </section>
              {chat.isLoading ? (
                <div
                  role='status'
                  className='mx-auto mt-5 flex max-w-3xl items-center gap-2 text-xs text-stone-500 dark:text-neutral-400'
                >
                  <span className='size-3 rounded-full border border-current border-t-transparent motion-safe:animate-spin' />
                  {activity}
                </div>
              ) : chat.stopped ? (
                <p
                  role='status'
                  className='mx-auto mt-5 max-w-3xl text-xs text-stone-500 dark:text-neutral-400'
                >
                  已停止回答
                </p>
              ) : null}
              {transcript.at(-1)?.role === 'user' && !chat.isLoading ? (
                <div className='mx-auto mt-3 w-full max-w-3xl'>
                  <Button
                    variant='unstyled'
                    onClick={() =>
                      runCommand(CHAT_COMMANDS.find((command) => command.id === 'retry')!)
                    }
                    aria-label='重试回答'
                    title='重试回答'
                    className='flex min-h-8 items-center gap-2 rounded-md text-xs text-stone-500 hover:text-stone-800 dark:text-neutral-400 dark:hover:text-neutral-100'
                  >
                    <ArrowPathIcon className='size-3.5' />
                    重试回答
                  </Button>
                </div>
              ) : null}
              <div className='mx-auto max-w-3xl space-y-2'>
                {chat.notice ? (
                  <p
                    role='status'
                    className='mt-4 text-xs leading-6 text-stone-500 dark:text-neutral-400'
                  >
                    {chat.notice}
                  </p>
                ) : null}
                {chat.error ? (
                  <p role='alert' className='mt-4 text-xs leading-6 text-red-600 dark:text-red-400'>
                    {chat.error}
                  </p>
                ) : null}
                {chat.contextTruncated ? (
                  <p
                    role='status'
                    className='mt-4 text-xs leading-6 text-stone-500 dark:text-neutral-400'
                  >
                    对话较长，回答仅参考最近的部分对话；完整记录仍保存在本地。
                  </p>
                ) : null}
                {feedback ? (
                  <div
                    role='status'
                    className='mt-3 flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-neutral-400'
                  >
                    {feedback}
                    <Button
                      variant='unstyled'
                      aria-label='关闭提示'
                      onClick={() => setFeedback(null)}
                      className={toolButtonClass}
                    >
                      <CloseIcon className='size-3' />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            {showJump && transcript.length ? (
              <div className='relative z-10 h-0'>
                <Button
                  variant='unstyled'
                  aria-label='回到最新'
                  title='回到最新'
                  onClick={() => {
                    if (scrollRef.current)
                      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    followLatest.current = true;
                    setShowJump(false);
                  }}
                  className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-500 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                >
                  <ChevronDownIcon className='size-3' />
                </Button>
              </div>
            ) : null}
            {composer}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ChatClient({
  userId: expectedUserId,
  available,
}: {
  userId: string;
  available: boolean;
}) {
  const { userId, isLoading } = useAuthenticatedUserId();
  const [expired, setExpired] = useState(false);
  const onUnauthorized = useCallback(() => setExpired(true), []);
  const authorized = !expired && userId === expectedUserId;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <div className='chat-interface bg-background text-foreground fixed inset-0 z-30'>
      {isLoading ? (
        <LoadingState message='正在验证登录状态…' />
      ) : !authorized ? (
        <Notice>
          登录状态已改变，请返回首页登录后重新打开 AI 助手。
          <Link href='/' className='ml-2 underline'>
            返回首页
          </Link>
        </Notice>
      ) : !available ? (
        <Notice>AI 助手暂时不可用，请稍后重试。</Notice>
      ) : (
        <Conversation key={userId} userId={userId} onUnauthorized={onUnauthorized} />
      )}
    </div>
  );
}
