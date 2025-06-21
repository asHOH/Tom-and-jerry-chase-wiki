import React, { useState, useEffect } from 'react';
import { characters, cards } from '@/data';
import { Character, Card } from '@/data/types'; // Import types directly

// Define a union type for search results
type SearchResult =
  | ({ type: 'character' } & Pick<Character, 'id' | 'imageUrl'>)
  | ({ type: 'card' } & Pick<Card, 'id' | 'imageUrl'>);

type SearchBarProps = {
  onSelectCharacter: (characterId: string) => void;
  onSelectCard: (cardId: string) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSelectCharacter, onSelectCard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 0) {
        setIsSearching(true);
        const lowerCaseQuery = searchQuery.toLowerCase();

        const filteredCharacters: SearchResult[] = Object.values(characters)
          .filter((character) => character.id.toLowerCase().includes(lowerCaseQuery))
          .map((character) => ({
            type: 'character',
            id: character.id,
            imageUrl: character.imageUrl!,
          }));

        const filteredCards: SearchResult[] = Object.values(cards)
          .filter((card) => card.id.toLowerCase().includes(lowerCaseQuery))
          .map((card) => ({
            type: 'card',
            id: card.id,
            imageUrl: card.imageUrl!,
          }));

        setSearchResults([...filteredCharacters, ...filteredCards]);
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

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'character') {
      onSelectCharacter(result.id);
    } else {
      onSelectCard(result.id);
    }
    setSearchQuery(''); // Clear search query
    setSearchResults([]); // Clear search results
  };

  return (
    <div className='relative w-full max-w-md mx-auto'>
      <input
        type='text'
        placeholder='搜索角色或知识卡...'
        className='w-full p-2 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
        {/* Search icon - replace with an actual SVG icon if available */}
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

      {isSearching && searchQuery.length > 0 && (
        <div className='absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1'>
          <div className='p-2 text-gray-500 dark:text-gray-400'>搜索中...</div>
        </div>
      )}

      {searchResults.length > 0 && !isSearching && (
        <ul className='absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto'>
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
                  <img
                    src={result.imageUrl}
                    alt={result.id}
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
        <div className='absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1'>
          <div className='p-2 text-gray-500 dark:text-gray-400'>无结果</div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
