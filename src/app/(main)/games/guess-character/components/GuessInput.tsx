'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/design';

type GuessInputProps = {
  /** All guessable character IDs and factions */
  allCharacters: readonly { id: string; factionId: 'cat' | 'mouse' }[];
  /** IDs already guessed (excluded) */
  guessedIds: ReadonlySet<string>;
  /** Called when the user submits a guess */
  onGuess: (characterId: string) => void;
  /** Whether input is disabled (game over) */
  disabled?: boolean;
};

/**
 * Simple character name input for the Guess Character game.
 * Type the exact character name and press Enter to submit.
 */
export default function GuessInput({
  allCharacters,
  guessedIds,
  onGuess,
  disabled = false,
}: GuessInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Available character IDs (not yet guessed)
  const available = useMemo(
    () => new Set(allCharacters.filter((c) => !guessedIds.has(c.id)).map((c) => c.id)),
    [allCharacters, guessedIds]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!available.has(trimmed)) {
      setError('角色不存在或已猜过');
      return;
    }

    setError(null);
    setInput('');
    onGuess(trimmed);
    inputRef.current?.focus();
  }, [input, available, onGuess]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className='relative w-full space-y-1'>
      <input
        ref={inputRef}
        type='text'
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? '游戏已结束' : '输入角色名称后回车...'}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border-2 bg-white px-4 py-3 text-lg',
          'transition-colors duration-150',
          'placeholder:text-gray-400',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500',
          'dark:focus:ring-blue-800',
          error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
        )}
        autoComplete='off'
        spellCheck={false}
      />
      {error && <p className='text-sm text-red-500 dark:text-red-400'>{error}</p>}
    </div>
  );
}
