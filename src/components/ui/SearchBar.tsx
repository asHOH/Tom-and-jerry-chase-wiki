import React, { useState } from 'react';
import SearchDialog from './SearchDialog'; // Import the new SearchDialog component

type SearchBarProps = {
  onSelectCharacter: (characterId: string) => void;
  onSelectCard: (cardId: string) => void;
  isMobile: boolean; // Add isMobile prop
};

const SearchBar: React.FC<SearchBarProps> = ({ onSelectCharacter, onSelectCard, isMobile }) => {
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  const handleOpenSearch = () => {
    setShowSearchDialog(true);
  };

  const handleCloseSearch = () => {
    setShowSearchDialog(false);
  };

  return (
    <div className='relative w-full max-w-md mx-auto'>
      <button
        onClick={handleOpenSearch}
        className='p-2 rounded-md bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white flex items-center justify-center w-11 h-11 border-none'
      >
        {/* Search icon */}
        <svg
          className='h-6 w-6 text-gray-900 dark:text-white'
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
      </button>

      {showSearchDialog && (
        <SearchDialog
          onClose={handleCloseSearch}
          onSelectCharacter={onSelectCharacter}
          onSelectCard={onSelectCard}
          isMobile={isMobile} // Pass isMobile prop
        />
      )}
    </div>
  );
};

export default SearchBar;
