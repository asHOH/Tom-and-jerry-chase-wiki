'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from '@/components/Image';
import { motion } from 'framer-motion'; // Import motion
import clsx from 'clsx';
import { performSearch, SearchResult } from '@/lib/searchUtils';
import { useAppContext } from '@/context/AppContext';
import { isOriginalCharacter } from '@/lib/editUtils';
import { useEditMode } from '@/context/EditModeContext';
import { useNavigation } from '@/lib/useNavigation';

type SearchDialogProps = {
  onClose: () => void;
  isMobile: boolean; // Add isMobile prop
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
        className='bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5'
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

const SearchDialog: React.FC<SearchDialogProps> = ({ onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchIdRef = useRef(0); // To keep track of the latest search request
  const resultsListRef = useRef<HTMLUListElement>(null);
  const { handleSelectCard, handleSelectCharacter } = useAppContext();
  const { isEditMode, toggleEditMode } = useEditMode();
  const { navigate } = useNavigation();

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      switch (result.type) {
        case 'character':
          // Check if this is an original character that has a static page
          if (isOriginalCharacter(result.id)) {
            handleSelectCharacter(result.id);
          } else {
            // For non-original characters, enable edit mode if not already enabled and navigate to edit page
            if (!isEditMode) {
              toggleEditMode();
            }
            // Navigate to the user character edit page
            handleSelectCharacter(result.id);
          }
          break;
        case 'card':
          handleSelectCard(result.id);
          break;
        case 'item':
          navigate(`/items/${result.name}`);
          break;
        case 'specialSkill':
          navigate(`/special-skills/${result.factionId}/${result.name}`);
          break;
      }
      setSearchQuery(''); // Clear search query
      setSearchResults([]); // Clear search results
      onClose(); // Close dialog after selection
    },
    [handleSelectCharacter, handleSelectCard, navigate, isEditMode, toggleEditMode, onClose]
  );

  // Animation variants for the dialog
  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  // Animation variants for the backdrop
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Handle navigation keys
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const newIndex = prev + 1;
            return newIndex >= searchResults.length ? 0 : newIndex; // Wrap to top
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const newIndex = prev - 1;
            return newIndex < 0 ? searchResults.length - 1 : newIndex; // Wrap to bottom
          });
          break;
        case 'Enter':
          // Only handle Enter if search input is not focused or if we have a highlighted result
          if (document.activeElement !== searchInputRef.current || highlightedIndex >= 0) {
            event.preventDefault();
            if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
              handleResultClick(searchResults[highlightedIndex]);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, highlightedIndex, searchResults, handleResultClick]); // Updated dependencies

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && resultsListRef.current) {
      const highlightedElement = resultsListRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    searchIdRef.current = Date.now(); // Assign a new ID for each new search effect run
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
            setSearchResults([...newResults]); // Store all results (already sorted by searchUtils)
            // Initialize highlighted index to first result if not set
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
      // On cleanup, ensure any ongoing search for this effect run is marked as stale
      // This is implicitly handled by `searchIdRef.current = Date.now()` in the next effect run
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <motion.div
      className={clsx(
        'fixed inset-0 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center z-50',
        isMobile && 'p-0'
      )}
      initial='hidden'
      animate='visible'
      exit='exit'
      variants={backdropVariants} // Apply backdrop animation
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={dialogRef}
        className={clsx(
          'bg-white dark:bg-gray-800 shadow-xl p-4 relative',
          isMobile
            ? 'w-full h-full rounded-none flex flex-col'
            : 'rounded-lg w-full max-w-md mx-auto'
        )}
        variants={dialogVariants} // Apply dialog animation
        transition={{ duration: 0.2 }}
      >
        <button
          type='button'
          onClick={onClose}
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          aria-label='关闭搜索对话框'
        >
          <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
        <div className='mb-4 pr-8'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>搜索</h2>
          {searchResults.length > 0 && (
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {searchResults.length} 个结果
            </span>
          )}
        </div>
        <div className='relative mb-4'>
          <input
            type='text'
            placeholder='搜索角色或知识卡...'
            className='w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            ref={searchInputRef}
          />
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <svg
              className='h-5 w-5 text-gray-400 dark:text-gray-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-label='搜索图标'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
        </div>

        {searchQuery.length > 0 && searchResults.length > 0 && (
          <motion.ul
            ref={resultsListRef}
            className={clsx(
              'overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md',
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
            {searchResults.map((result, index) => (
              <motion.li
                // @ts-expect-error: assuming result.type, result.id, result.name, and result.factionId are always defined
                key={`${result.type}-${result.id}-${result.name}-${result.factionId}`}
                className='border-b border-gray-200 dark:border-gray-700 last:border-b-0'
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type='button'
                  onClick={() => handleResultClick(result)}
                  className={clsx(
                    'flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left',
                    highlightedIndex === index && 'bg-gray-100 dark:bg-gray-700'
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {result.imageUrl && (
                    <Image
                      src={result.imageUrl}
                      // @ts-expect-error: assuming result.type, result.id, result.name, and result.factionId are always defined
                      alt={result.id ?? result.name ?? ''}
                      width={32}
                      height={32}
                      className='object-cover mr-3'
                    />
                  )}
                  <span className='text-gray-900 dark:text-white whitespace-nowrap'>
                    {'id' in result ? result.id : 'name' in result ? result.name : ''}{' '}
                    {/* ({result.type === 'character' ? '角色' : '知识卡'}) */}
                  </span>
                  {result.matchContext && (
                    <span className='ml-2 text-gray-500 dark:text-gray-400 text-sm truncate'>
                      {highlightMatch(result.matchContext, searchQuery, result.isPinyinMatch)}
                    </span>
                  )}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {searchQuery.length > 0 && searchResults.length === 0 && (
          <div className='p-2 text-gray-500 dark:text-gray-400 pr-8'>无结果</div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SearchDialog;
