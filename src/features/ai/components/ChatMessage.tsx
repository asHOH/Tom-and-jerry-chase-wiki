'use client';

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useState,
  type ComponentProps,
  type JSX,
  type ReactNode,
} from 'react';
import { cjk } from '@streamdown/cjk';
import { Streamdown, type Components, type ExtraProps } from 'streamdown';

import type { ChatTextMessage } from '@/lib/ai/chatMessages';
import { cn } from '@/lib/design';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import Button from '@/components/ui/Button';
import { ArrowPathIcon, CheckIcon, DocumentTextIcon } from '@/components/icons/CommonIcons';

import MentionText from './MentionText';

const INLINE_MARKDOWN_ELEMENTS = new Set(['strong', 'em', 'del', 's', 'sub', 'sup', 'kbd', 'mark']);
const STREAMDOWN_TRANSLATIONS = {
  close: '关闭',
  externalLinkWarning: '即将打开外部链接，请确认网址安全。',
  openExternalLink: '打开外部链接',
  openLink: '打开链接',
};

function linkifyMarkdownText(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return <MentionText text={child} />;
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (typeof child.type !== 'string' || !INLINE_MARKDOWN_ELEMENTS.has(child.type)) return child;

    return cloneElement(child, {}, linkifyMarkdownText(child.props.children));
  });
}

function createMentionAwareBlock<Tag extends keyof JSX.IntrinsicElements>(tag: Tag) {
  return function MentionAwareBlock({
    children,
    node: _node,
    ...props
  }: ComponentProps<Tag> & ExtraProps) {
    return createElement(tag, props, linkifyMarkdownText(children));
  };
}

const markdownComponents = {
  p: createMentionAwareBlock('p'),
  h1: createMentionAwareBlock('h1'),
  h2: createMentionAwareBlock('h2'),
  h3: createMentionAwareBlock('h3'),
  h4: createMentionAwareBlock('h4'),
  h5: createMentionAwareBlock('h5'),
  h6: createMentionAwareBlock('h6'),
  li: createMentionAwareBlock('li'),
  blockquote: createMentionAwareBlock('blockquote'),
  td: createMentionAwareBlock('td'),
  th: createMentionAwareBlock('th'),
} satisfies Components;

export default function ChatMessage({
  message,
  streaming,
  onRetry,
}: {
  message: ChatTextMessage;
  streaming: boolean;
  onRetry?: (() => void) | undefined;
}) {
  const { copied, copy } = useCopyToClipboard();
  const [failed, setFailed] = useState(false);
  const text = message.parts[0]?.text ?? '';
  const isUser = message.role === 'user';
  return (
    <article
      className={cn('group mx-auto w-full max-w-3xl', isUser && 'flex justify-end')}
      aria-label={isUser ? '你的消息' : 'AI 助手的回答'}
    >
      <div
        className={cn(
          'min-w-0',
          isUser ? 'max-w-[90%] rounded-2xl bg-black/5 px-4 py-3 dark:bg-white/5' : 'py-1'
        )}
      >
        <h2 className='sr-only'>{isUser ? '你' : '助手'}</h2>
        {isUser ? (
          <p className='text-sm leading-7 wrap-anywhere whitespace-pre-wrap sm:text-base'>
            <MentionText text={text} />
          </p>
        ) : (
          <Streamdown
            plugins={{ cjk }}
            components={markdownComponents}
            controls={false}
            skipHtml
            isAnimating={streaming}
            caret='circle'
            translations={STREAMDOWN_TRANSLATIONS}
            className='prose prose-sm dark:prose-invert sm:prose-base max-w-none text-sm leading-7 wrap-anywhere text-inherit'
          >
            {text}
          </Streamdown>
        )}
        {!isUser && !streaming ? (
          <div className='mt-2 flex items-center gap-2'>
            <Button
              variant='unstyled'
              aria-label={copied ? '已复制回答' : '复制回答'}
              title={copied ? '已复制回答' : '复制回答'}
              onClick={() => void copy(text).then((success) => setFailed(!success))}
              className='flex min-h-8 items-center gap-1.5 rounded-md px-1 text-xs text-stone-500 transition-colors hover:text-stone-800 dark:text-neutral-400 dark:hover:text-neutral-100'
            >
              {copied ? (
                <CheckIcon className='size-3.5' />
              ) : (
                <DocumentTextIcon className='size-3.5' />
              )}
            </Button>
            {onRetry ? (
              <Button
                variant='unstyled'
                aria-label='重试回答'
                title='重新生成回答'
                onClick={onRetry}
                className='flex size-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:text-stone-800 dark:text-neutral-400 dark:hover:text-neutral-100'
              >
                <ArrowPathIcon className='size-3.5' />
              </Button>
            ) : null}
            {failed ? (
              <span role='status' className='text-xs text-red-600 dark:text-red-400'>
                复制失败，请选择文字后复制。
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
