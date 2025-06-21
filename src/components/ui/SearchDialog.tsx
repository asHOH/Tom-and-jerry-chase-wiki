import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { performSearch, SearchResult } from '@/lib/searchUtils';

type SearchDialogProps = {
  onClose: () => void;
  onSelectCharacter: (characterId: string) => void;
  onSelectCard: (cardId: string) => void;
};

const SearchDialog: React.FC<SearchDialogProps> = ({
  onClose,
  onSelectCharacter,
  onSelectCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        const results = performSearch(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300); // Debounce for 300ms

    return () => {
      clearTimeout(handler);
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

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'character') {
      onSelectCharacter(result.id);
    } else {
      onSelectCard(result.id);
    }
    setSearchQuery(''); // Clear search query
    setSearchResults([]); // Clear search results
    onClose(); // Close dialog after selection
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div
        ref={dialogRef}
        className='bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-md mx-auto relative'
      >
        <button
          onClick={onClose}
          className='absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
        <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-white'>搜索</h2>
        <div className='relative mb-4'>
          <input
            type='text'
            placeholder='搜索角色或知识卡...'
            className='w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <svg
              className='h-5 w-5 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
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

        {isSearching && searchQuery.length > 0 && (
          <div className='p-2 text-gray-500 dark:text-gray-400'>搜索中...</div>
        )}

        {searchResults.length > 0 && !isSearching && (
          <ul className='max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md'>
            {searchResults.map((result) => (
              <li
                key={`${result.type}-${result.id}`}
                className='border-b border-gray-200 dark:border-gray-700 last:border-b-0'
              >
                <button
                  onClick={() => handleResultClick(result)}
                  className='flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left'
                >
                  {result.imageUrl && (
                    <Image
                      src={result.imageUrl}
                      alt={result.id}
                      width={32}
                      height={32}
                      className='w-8 h-8 object-cover rounded-full mr-3'
                    />
                  )}
                  <span className='text-gray-900 dark:text-white'>
                    {result.id} ({result.type === 'character' ? '角色' : '知识卡'})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
          <div className='p-2 text-gray-500 dark:text-gray-400'>无结果</div>
        )}
      </div>
    </div>
  );
};

export default SearchDialog;
