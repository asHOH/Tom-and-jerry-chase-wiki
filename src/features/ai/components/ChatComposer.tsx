'use client';

import { useEffect, useId, useRef, useState } from 'react';

import {
  CHAT_COMMANDS,
  getComposerTrigger,
  replaceComposerTrigger,
  type ChatCommand,
} from '@/lib/ai/chatCommands';
import { CHAT_MAX_QUESTION_LENGTH } from '@/lib/ai/chatMessages';
import {
  CHAT_REFERENCE_LABELS,
  referenceToken,
  searchChatReferences,
  type ChatReference,
  type ChatReferenceLabel,
} from '@/lib/ai/chatReferences';
import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import { ChevronUpIcon } from '@/components/icons/CommonIcons';

import ChatMentionInput, { type ChatMentionInputHandle } from './ChatMentionInput';

const FILTERS = ['全部', ...CHAT_REFERENCE_LABELS] as const;

type ChatComposerProps = {
  question: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCommand: (command: ChatCommand) => void;
  catalog: readonly ChatReference[];
  isLoading: boolean;
  hasMessages: boolean;
  onStop: () => void;
};

export default function ChatComposer({
  question,
  onChange,
  onSubmit,
  onCommand,
  catalog,
  isLoading,
  hasMessages,
  onStop,
}: ChatComposerProps) {
  const inputRef = useRef<ChatMentionInputHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [menuMaxHeight, setMenuMaxHeight] = useState(160);
  const composing = useRef(false);
  const [caret, setCaret] = useState(question.length);
  const [dismissed, setDismissed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<ChatReferenceLabel | undefined>();
  const [references, setReferences] = useState<ChatReference[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const listId = useId();
  const trigger = paletteOpen
    ? { type: 'command' as const, query: '', start: 0, end: 0 }
    : getComposerTrigger(question, caret);
  const triggerType = trigger?.type;
  const query = trigger?.query ?? '';
  const menuOpen = Boolean(trigger && !dismissed);
  const commands = CHAT_COMMANDS.filter((command) => command.id.includes(query.toLowerCase()));
  const optionCount = triggerType === 'reference' ? references.length : commands.length;
  const activeIndex = Math.min(selected, Math.max(0, optionCount - 1));

  const focusAt = (position: number) => {
    setCaret(position);
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(position, position);
  };
  const updateQuestion = (text: string, position = text.length) => {
    onChange(text);
    setDismissed(false);
    setSelected(0);
    setCaret(position);
    inputRef.current?.replaceValueAndFocus(text, position);
  };

  useEffect(() => {
    setSelected(0);
    setDismissed(false);
    if (!inputRef.current?.isFocused) setCaret(question.length);
  }, [question]);

  useEffect(() => {
    if (triggerType !== 'reference' || dismissed) return;
    let active = true;
    setSearching(true);
    setSearchFailed(false);
    const timer = window.setTimeout(() => {
      void searchChatReferences(catalog, query, filter)
        .then((items) => {
          if (active) {
            setReferences(items);
            setSearching(false);
          }
        })
        .catch(() => {
          if (active) {
            setReferences([]);
            setSearching(false);
            setSearchFailed(true);
          }
        });
    }, 100);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [catalog, dismissed, filter, query, triggerType]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        // Open the palette without replacing the user's draft.
        setPaletteOpen(true);
        setDismissed(false);
        setSelected(0);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  });

  useEffect(() => {
    if (menuOpen && !(triggerType === 'reference' && searching)) {
      document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, listId, menuOpen, searching, triggerType]);

  useEffect(() => {
    if (!menuOpen) return;
    const resizeMenu = () => {
      const top = formRef.current?.getBoundingClientRect().top ?? window.innerHeight;
      const headerHeight = triggerType === 'reference' ? 40 : 0;
      setMenuMaxHeight(
        Math.max(48, Math.min(208, window.innerHeight * 0.25, top - headerHeight - 72))
      );
    };
    resizeMenu();
    window.addEventListener('resize', resizeMenu);
    return () => window.removeEventListener('resize', resizeMenu);
  }, [menuOpen, question, triggerType]);

  const selectOption = (index: number) => {
    if (!trigger) return;
    if (trigger.type === 'reference') {
      const reference = references[index];
      if (!reference || searching) return;
      const replacement = replaceComposerTrigger(question, trigger, referenceToken(reference));
      if (replacement.text.length > CHAT_MAX_QUESTION_LENGTH) return;
      updateQuestion(replacement.text, replacement.caret);
    } else {
      const command = commands[index];
      if (
        !command ||
        ((command.id === 'retry' || command.id === 'clear' || command.id === 'export') &&
          (!hasMessages || isLoading))
      )
        return;
      setDismissed(true);
      setPaletteOpen(false);
      onCommand(command);
      focusAt(0);
    }
  };

  return (
    <div className='w-full shrink-0 bg-transparent px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-8 sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]'>
      <form
        ref={formRef}
        onBlurCapture={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDismissed(true);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className='relative mx-auto max-w-2xl rounded-2xl border border-black/10 bg-black/[0.02] shadow-sm focus-within:border-black/25 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:border-white/25'
      >
        {menuOpen ? (
          <div
            className='bg-background absolute right-0 bottom-[calc(100%+0.5rem)] left-0 z-20 overflow-hidden rounded-xl border border-black/10 shadow-lg dark:border-white/10'
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setDismissed(true);
                inputRef.current?.focus();
              }
            }}
          >
            {triggerType === 'reference' ? (
              <div className='border-border flex gap-0.5 overflow-x-auto border-b px-1.5 py-1'>
                {FILTERS.map((label) => (
                  <Button
                    key={label}
                    variant='unstyled'
                    aria-pressed={label === '全部' ? !filter : filter === label}
                    onClick={() => {
                      setFilter(label === '全部' ? undefined : label);
                      setSelected(0);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      'min-h-8 shrink-0 rounded-md px-2 py-1 text-xs',
                      (label === '全部' ? !filter : filter === label)
                        ? 'bg-black/5 text-stone-900 dark:bg-white/10 dark:text-neutral-100'
                        : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            ) : null}
            <div
              role='listbox'
              id={listId}
              aria-label={triggerType === 'reference' ? '百科引用建议' : '斜杠命令'}
              className='overflow-y-auto p-1'
              style={{ maxHeight: menuMaxHeight }}
            >
              {triggerType === 'reference' ? (
                searching ? (
                  <p role='status' className='text-muted-foreground px-3 py-5 text-sm'>
                    正在查找资料…
                  </p>
                ) : references.length === 0 ? (
                  <p role='status' className='text-muted-foreground px-3 py-5 text-sm'>
                    {searchFailed
                      ? '资料查询失败，请重新输入重试。'
                      : '没有匹配资料，试试名称、别名或拼音。'}
                  </p>
                ) : (
                  references.map((reference, index) => (
                    <Button
                      key={reference.key}
                      id={`${listId}-${index}`}
                      role='option'
                      aria-selected={activeIndex === index}
                      tabIndex={-1}
                      variant='unstyled'
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectOption(index)}
                      className={cn(
                        'flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
                        activeIndex === index
                          ? 'bg-black/5 dark:bg-white/10'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                        {reference.name}
                      </span>
                      <span className='text-muted-foreground shrink-0 text-xs'>
                        {reference.label}
                      </span>
                    </Button>
                  ))
                )
              ) : (
                commands.map((command, index) => (
                  <Button
                    key={command.id}
                    id={`${listId}-${index}`}
                    role='option'
                    aria-selected={activeIndex === index}
                    aria-disabled={
                      (command.id === 'retry' ||
                        command.id === 'clear' ||
                        command.id === 'export') &&
                      (!hasMessages || isLoading)
                    }
                    tabIndex={-1}
                    variant='unstyled'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(index)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left aria-disabled:opacity-40',
                      activeIndex === index
                        ? 'bg-black/5 dark:bg-white/10'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                  >
                    <span className='text-muted-foreground w-16 shrink-0 font-mono text-xs'>
                      /{command.id}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-medium'>{command.label}</span>
                      <span className='text-muted-foreground block truncate text-xs'>
                        {command.description}
                      </span>
                    </span>
                  </Button>
                ))
              )}
              {triggerType === 'command' && commands.length === 0 ? (
                <p className='text-muted-foreground px-3 py-5 text-sm'>
                  未找到命令。输入 / 查看所有命令。
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <ChatMentionInput
          ref={inputRef}
          value={question}
          menuId={menuOpen ? listId : undefined}
          activeOptionId={
            menuOpen && optionCount > 0 && !(triggerType === 'reference' && searching)
              ? `${listId}-${activeIndex}`
              : undefined
          }
          onChange={(value, position) => {
            setPaletteOpen(false);
            onChange(value);
            setCaret(position);
            setSelected(0);
            setDismissed(false);
          }}
          onCaretChange={setCaret}
          onClick={() => setDismissed(false)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
            setCaret(inputRef.current?.selectionStart ?? question.length);
          }}
          onKeyDown={(event) => {
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onSubmit();
              return;
            }
            if (event.key === 'Escape') {
              setDismissed(true);
              return;
            }
            if (menuOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault();
              setSelected((current) =>
                optionCount
                  ? (current + (event.key === 'ArrowDown' ? 1 : -1) + optionCount) % optionCount
                  : 0
              );
              return;
            }
            if (
              menuOpen &&
              !event.shiftKey &&
              (event.key === 'Tab' || event.key === 'Enter') &&
              optionCount > 0 &&
              !(triggerType === 'reference' && searching)
            ) {
              event.preventDefault();
              selectOption(activeIndex);
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!menuOpen) onSubmit();
            }
          }}
        />
        <div className='flex items-center justify-between gap-2 px-2 pb-2'>
          <div className='flex items-center gap-1'>
            <Button
              variant='unstyled'
              aria-label='引用资料'
              title='引用角色、知识卡等资料'
              onClick={() => {
                const position = inputRef.current?.selectionStart ?? question.length;
                updateQuestion(
                  question.slice(0, position) + '@' + question.slice(position),
                  position + 1
                );
              }}
              className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg text-base font-medium hover:bg-black/5 dark:hover:bg-white/5'
            >
              @
            </Button>
            <Button
              variant='unstyled'
              aria-label='快捷命令'
              title='快捷命令'
              onClick={() => {
                setPaletteOpen(true);
                setDismissed(false);
                setSelected(0);
                inputRef.current?.focus();
              }}
              className='text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg font-mono text-base hover:bg-black/5 dark:hover:bg-white/5'
            >
              /
            </Button>
          </div>
          <div className='flex items-center gap-3'>
            {question.length > 3200 ? (
              <span className='text-muted-foreground text-xs'>
                {question.length}/{CHAT_MAX_QUESTION_LENGTH}
              </span>
            ) : null}
            {isLoading ? (
              <Button
                variant='unstyled'
                aria-label='停止回答'
                title='停止回答'
                onClick={onStop}
                className='bg-foreground text-background flex size-9 items-center justify-center rounded-xl'
              >
                <span className='size-3 rounded-sm bg-current' />
              </Button>
            ) : (
              <Button
                variant='unstyled'
                type='submit'
                aria-label='发送'
                title='发送'
                disabled={!question.trim()}
                className='flex size-9 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white'
              >
                <ChevronUpIcon className='size-5' strokeWidth={2.5} />
              </Button>
            )}
          </div>
        </div>
      </form>
      <p id='ai-composer-help' className='sr-only'>
        <span>对话仅保存在此浏览器</span>
        <span>
          Enter 发送 <span className='hidden sm:inline'>· Shift+Enter 换行 · Ctrl/⌘ K 聚焦</span>
        </span>
      </p>
    </div>
  );
}
