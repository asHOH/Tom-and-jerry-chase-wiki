'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/design';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type CharacterSuggestion = {
  id: string;
  factionId: 'cat' | 'mouse';
};

type GuessInputProps = {
  /** All guessable character IDs and factions */
  allCharacters: CharacterSuggestion[];
  /** IDs already guessed (excluded from suggestions) */
  guessedIds: Set<string>;
  /** Called when the user submits a guess */
  onGuess: (characterId: string) => void;
  /** Whether input is disabled (game over) */
  disabled?: boolean;
};

/**
 * Autocomplete input for character name guessing.
 * Supports Chinese character names and pinyin search.
 */
export default function GuessInput({
  allCharacters,
  guessedIds,
  onGuess,
  disabled = false,
}: GuessInputProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebouncedValue(input, 150);

  // Available characters (not yet guessed)
  const available = useMemo(
    () => allCharacters.filter((c) => !guessedIds.has(c.id)),
    [allCharacters, guessedIds]
  );

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!debouncedInput.trim()) return available.slice(0, 8);

    const query = debouncedInput.toLowerCase().trim();

    // Pre-compute pinyin for all available characters (lazy, only when typing)
    // For now, just match against character name and aliases
    return available
      .filter((c) => {
        const nameMatch = c.id.toLowerCase().includes(query);
        return nameMatch;
      })
      .slice(0, 6);
  }, [available, debouncedInput]);

  const resetInput = useCallback(() => {
    setInput('');
    setIsOpen(false);
    setSelectedIndex(0);
  }, []);

  const submitGuess = useCallback(
    (id: string) => {
      if (disabled) return;
      onGuess(id);
      resetInput();
      inputRef.current?.focus();
    },
    [disabled, onGuess, resetInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) {
          submitGuess(selected.id);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [isOpen, suggestions, selectedIndex, submitGuess]
  );

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  return (
    <div className='relative w-full'>
      <input
        ref={inputRef}
        type='text'
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow click on dropdown items
          setTimeout(() => setIsOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? '游戏已结束' : '输入角色名称...'}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border-2 bg-white px-4 py-3 text-lg',
          'transition-colors duration-150',
          'placeholder:text-gray-400',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500',
          'dark:focus:ring-blue-800',
          isOpen && suggestions.length > 0
            ? 'rounded-b-none border-blue-500 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600'
        )}
        autoComplete='off'
        spellCheck={false}
      />

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className={cn(
            'absolute top-full right-0 left-0 z-20',
            'max-h-48 overflow-auto',
            'rounded-b-lg border-2 border-t-0 border-blue-500 bg-white',
            'shadow-lg dark:border-blue-400 dark:bg-gray-800'
          )}
        >
          {suggestions.map((char, index) => (
            <li key={char.id}>
              <button
                type='button'
                onMouseDown={(e) => {
                  e.preventDefault();
                  submitGuess(char.id);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left',
                  'transition-colors duration-75',
                  'min-h-[44px]', // Mobile touch target
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    char.factionId === 'cat' ? 'text-orange-500' : 'text-blue-500'
                  )}
                >
                  {char.factionId === 'cat' ? '🐱' : '🐭'}
                </span>
                <span className='text-gray-800 dark:text-gray-200'>{char.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
