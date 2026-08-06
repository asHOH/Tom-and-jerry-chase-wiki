'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';

import { cn, getTypeLabelColors } from '@/lib/design';
import { performSearch, SearchResult } from '@/lib/searchUtils';
import { useChat } from '@/hooks/useChat';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';
import Tag from '@/components/ui/Tag';
import { ChatBubbleIcon, CloseIcon, SearchIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
};

const highlightMatch = (text: string, query: string, isPinyinMatch: boolean) => {
  if (isPinyinMatch) {
    return <>{text}</>; // Do not highlight if it's a pinyin match
  }

  let processedText = text;
  let processedLowerCaseText = text.toLowerCase();
  const lowerCaseQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let firstMatchIndex = processedLowerCaseText.indexOf(lowerCaseQuery);

  if (firstMatchIndex !== -1) {
    let lastCommaIndex = -1;
    // Search for the last comma (English or Chinese) before the first match
    for (let i = firstMatchIndex - 1; i >= 0; i--) {
      const char = processedText.charAt(i);
      if (char === ',' || char === '，') {
        lastCommaIndex = i;
        break;
      }
    }

    if (lastCommaIndex !== -1) {
      // Truncate the text to start after the last comma
      processedText = processedText.substring(lastCommaIndex + 1).trim();
      processedLowerCaseText = processedText.toLowerCase();
      // Recalculate firstMatchIndex relative to the new processedText
      firstMatchIndex = processedLowerCaseText.indexOf(lowerCaseQuery);
    }
  }

  let matchIndex = firstMatchIndex; // Start the loop with the (potentially new) firstMatchIndex

  while (matchIndex !== -1) {
    if (matchIndex > lastIndex) {
      parts.push(processedText.substring(lastIndex, matchIndex));
    }
    parts.push(
      <span
        key={matchIndex} // Using matchIndex as key, assuming it's unique enough for this context
        className='rounded bg-yellow-300 px-0.5 text-black dark:bg-yellow-600 dark:text-white'
      >
        {processedText.substring(matchIndex, matchIndex + query.length)}
      </span>
    );
    lastIndex = matchIndex + query.length;
    matchIndex = processedLowerCaseText.indexOf(lowerCaseQuery, lastIndex);
  }

  if (lastIndex < processedText.length) {
    parts.push(processedText.substring(lastIndex));
  }

  return <>{parts}</>;
};

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchIdRef = useRef(0); // To keep track of the latest search request
  const resultsListRef = useRef<HTMLUListElement>(null);
  const { handleSelectCard, handleSelectCharacter } = useAppContext();
  const { navigate } = useNavigation();
  const [isDarkMode] = useDarkMode();

  useEffect(() => {
    if (open) return;

    searchIdRef.current += 1;
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedIndex(-1);
  }, [open]);

  const getResultLabel = (result: SearchResult): string => {
    switch (result.type) {
      case 'character':
        return '角色';
      case 'card':
        return '知识卡';
      case 'specialSkill':
        return result.factionId === 'mouse' ? '鼠特技' : '猫特技';
      case 'itemGroup':
        return '组合';
      case 'item':
        return '道具';
      case 'entity':
        return '衍生物';
      case 'buff':
        return '状态';
      case 'map':
        return '地图';
      case 'fixture':
        return '地图组件';
      case 'mode':
        return '游戏模式';
      case 'achievement':
        return '对局成就';
      case 'doc':
        return '文档';
      default:
        return '结果';
    }
  };

  const getTypeColorKey = (result: SearchResult): string => {
    if (result.type === 'specialSkill') {
      return result.factionId === 'mouse' ? 'special-skill-mouse' : 'special-skill-cat';
    }
    return result.type;
  };

  const getResultName = (result: SearchResult): string => {
    return 'id' in result ? result.id : result.name;
  };

  const getResultKey = (result: SearchResult): string => {
    switch (result.type) {
      case 'specialSkill':
        return `${result.type}-${result.factionId}-${result.name}`;
      case 'doc':
        return `${result.type}-${result.slug}`;
      case 'buff':
        return `${result.type}-${result.detailedBuffId ?? result.name}`;
      default:
        return `${result.type}-${getResultName(result)}`;
    }
  };

  // Use chat hook to get AI response for the search query
  const {
    responseText: aiResponseText,
    isLoading: isChatLoading,
    stop: stopChat,
  } = useChat(open && searchQuery.length > 1 ? searchQuery : undefined, 2000);
  const hasAiResult = open && searchQuery.length > 1 && Boolean(aiResponseText?.trim());
  const hasAiEntry = hasAiResult || (open && searchQuery.length > 1 && isChatLoading);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      switch (result.type) {
        case 'character':
          handleSelectCharacter(result.id);
          break;
        case 'card':
          handleSelectCard(result.id);
          break;
        case 'itemGroup':
          navigate(`/itemGroups/${encodeURIComponent(result.name)}`);
          break;
        case 'item':
          navigate(`/items/${encodeURIComponent(result.name)}`);
          break;
        case 'entity':
          navigate(`/entities/${encodeURIComponent(result.name)}`);
          break;
        case 'buff':
          if (result.href) {
            navigate(result.href);
          } else if (result.detailedBuffId) {
            navigate('/buffs');
          } else {
            navigate(`/buffs/${encodeURIComponent(result.name)}`);
          }
          break;
        case 'map':
          navigate(`/maps/${encodeURIComponent(result.name)}`);
          break;
        case 'fixture':
          navigate(`/fixtures/${encodeURIComponent(result.name)}`);
          break;
        case 'mode':
          navigate(`/modes/${encodeURIComponent(result.name)}`);
          break;
        case 'specialSkill':
          navigate(
            `/special-skills/${encodeURIComponent(result.factionId)}/${encodeURIComponent(
              result.name
            )}`
          );
          break;
        case 'achievement':
          navigate(
            `/achievements/${encodeURIComponent(result.factionId)}/${encodeURIComponent(result.name)}`
          );
          break;
        case 'doc':
          navigate(result.path);
          break;
        default:
          break;
      }
      setSearchQuery(''); // Clear search query
      setSearchResults([]); // Clear search results
      onClose(); // Close dialog after selection
    },
    [handleSelectCharacter, handleSelectCard, navigate, onClose]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle navigation keys
      const totalResults = hasAiEntry ? searchResults.length + 1 : searchResults.length;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const newIndex = prev + 1;
            return newIndex >= totalResults ? 0 : newIndex; // Wrap to top
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const newIndex = prev - 1;
            return newIndex < 0 ? totalResults - 1 : newIndex; // Wrap to bottom
          });
          break;
        case 'Enter':
          // Only handle Enter if search input is not focused or if we have a highlighted result
          if (document.activeElement !== searchInputRef.current || highlightedIndex >= 0) {
            event.preventDefault();
            if (highlightedIndex >= 0) {
              // If chat result is highlighted (index 0 when chat is present), do nothing
              if (hasAiEntry && highlightedIndex === 0) {
                // Chat result is highlighted, do nothing for now
                return;
              }
              // Handle regular search results
              const resultIndex = hasAiEntry ? highlightedIndex - 1 : highlightedIndex;
              if (resultIndex >= 0 && searchResults[resultIndex]) {
                handleResultClick(searchResults[resultIndex]);
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, highlightedIndex, searchResults, handleResultClick, hasAiEntry]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && highlightedIndex >= 0 && resultsListRef.current) {
      const highlightedElement = resultsListRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [open, highlightedIndex]);

  useEffect(() => {
    if (!open) return;

    searchIdRef.current += 1;
    const currentId = searchIdRef.current;

    const handler = setTimeout(async () => {
      if (searchQuery.length > 0) {
        setSearchResults([]); // Clear previous results
        const searchGenerator = performSearch(searchQuery);
        let newResults: SearchResult[] = [];

        for await (const result of searchGenerator) {
          // Only update if this is still the latest search query
          if (searchIdRef.current === currentId) {
            newResults = [...newResults, result];
            setSearchResults(newResults); // Store all results (already sorted by searchUtils)
            // Initialize highlighted index to the first visible result.
            if (newResults.length === 1) {
              setHighlightedIndex(0);
            }
          } else {
            break; // A new search has started, stop processing old results
          }
        }
      } else {
        setSearchResults([]);
        setHighlightedIndex(-1);
      }
    }, 300); // Debounce for 300ms

    return () => {
      clearTimeout(handler);
      searchIdRef.current += 1;
    };
  }, [open, searchQuery]);

  return (
    <BaseDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      ariaLabelledBy='search-dialog-title'
      lockScroll={false}
      panelClassName={cn(
        'p-4',
        isMobile
          ? 'inset-0 flex h-full w-full flex-col rounded-none'
          : 'inset-auto top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2'
      )}
    >
      <Button
        variant='unstyled'
        type='button'
        onClick={onClose}
        className='absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        aria-label='关闭搜索对话框'
      >
        <CloseIcon className='h-6 w-6' />
      </Button>
      <div className='mb-4 pr-8'>
        <h2
          id='search-dialog-title'
          className='mb-1 text-xl font-bold text-gray-900 dark:text-white'
        >
          搜索
        </h2>
        {(searchResults.length > 0 || hasAiEntry) && (
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            {searchResults.length + (hasAiEntry ? 1 : 0)} 个结果
          </span>
        )}
      </div>
      <div className='relative mb-4'>
        <FormInput
          type='text'
          placeholder='搜索角色、知识卡、道具、状态、地图、文档...'
          size='sm'
          className='rounded-md p-2 pl-10 text-base'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          ref={searchInputRef}
          id='search-input'
        />
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          <SearchIcon
            className='h-5 w-5 text-gray-400 dark:text-gray-500'
            decorative={false}
            aria-label='搜索图标'
          />
        </div>
      </div>

      {searchQuery.length > 0 && (searchResults.length > 0 || hasAiEntry) && (
        <m.ul
          ref={resultsListRef}
          className={cn(
            'overflow-y-auto rounded-md border border-gray-300 dark:border-gray-600',
            isMobile ? 'flex-1' : 'max-h-60'
          )}
          initial='hidden'
          animate='visible'
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05, // Stagger animation for children
              },
            },
          }}
        >
          {/* Chat result as first item */}
          {hasAiEntry && (
            <m.li
              key='chat-result'
              className='border-b border-gray-200 dark:border-gray-700'
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={cn(
                  'flex items-start bg-blue-50 p-3 dark:bg-blue-900/20',
                  highlightedIndex === 0 && 'bg-blue-100 dark:bg-blue-900/40'
                )}
                onMouseEnter={() => setHighlightedIndex(0)}
              >
                <div className='mr-3 shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600'>
                    <ChatBubbleIcon className='h-4 w-4 text-white' strokeWidth={2} />
                  </div>
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center justify-between gap-3'>
                    <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                      {isChatLoading ? 'AI 助手正在回答' : 'AI 助手回答'}
                    </span>
                    {isChatLoading && (
                      <Button
                        variant='unstyled'
                        size='sm'
                        onClick={stopChat}
                        className='pointer-events-auto shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40'
                        aria-label='停止 AI 回答'
                      >
                        停止
                      </Button>
                    )}
                  </div>
                  <div className='text-sm text-gray-700 dark:text-gray-300'>
                    <div className='whitespace-pre-wrap'>
                      {aiResponseText || (isChatLoading ? '正在生成回答...' : '')}
                    </div>
                  </div>
                </div>
              </div>
            </m.li>
          )}

          {/* Regular search results */}
          {searchResults.map((result, index) => (
            <m.li
              key={getResultKey(result)}
              className='border-b border-gray-200 last:border-b-0 dark:border-gray-700'
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant='unstyled'
                type='button'
                onClick={() => handleResultClick(result)}
                className={cn(
                  'flex w-full items-center gap-2 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700',
                  highlightedIndex === (hasAiResult ? index + 1 : index) &&
                    'bg-gray-100 dark:bg-gray-700'
                )}
                onMouseEnter={() => setHighlightedIndex(hasAiResult ? index + 1 : index)}
              >
                {result.imageUrl && (
                  <Image
                    src={result.imageUrl}
                    alt={getResultName(result)}
                    width={32}
                    height={32}
                    className='mr-3 object-cover'
                  />
                )}
                <div className='min-w-0 flex-1'>
                  <span className='block truncate text-gray-900 dark:text-white'>
                    {getResultName(result)}
                  </span>
                  {result.matchContext && (
                    <span className='mt-0.5 hidden truncate text-sm text-gray-500 md:block dark:text-gray-400'>
                      {highlightMatch(result.matchContext, searchQuery, result.isPinyinMatch)}
                    </span>
                  )}
                </div>
                <Tag
                  colorStyles={getTypeLabelColors(getTypeColorKey(result), isDarkMode)}
                  size='xs'
                  margin='compact'
                  className='shrink-0'
                >
                  {getResultLabel(result)}
                </Tag>
              </Button>
            </m.li>
          ))}
        </m.ul>
      )}

      {searchQuery.length > 0 && searchResults.length === 0 && !hasAiResult && !isChatLoading && (
        <div className='p-2 pr-8 text-gray-500 dark:text-gray-400'>无结果</div>
      )}
    </BaseDialog>
  );
};

export default SearchDialog;
