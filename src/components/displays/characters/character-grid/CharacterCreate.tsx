'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '@/context/EditModeContext';
import BaseCard from '../../../ui/BaseCard';
import { componentTokens, designTokens } from '@/lib/design-tokens';
import { handleCharacterIdChange } from '@/lib/editUtils';
import { usePathname } from 'next/navigation';
import { FactionId } from '@/data';
import { useAppContext } from '@/context/AppContext';

export default function CharacterCreate() {
  const { width, height } = componentTokens.image.dimensions.CHARACTER_CARD;
  const containerHeight = componentTokens.image.container.height;
  const factionId = usePathname().split('/').filter(Boolean).at(-1)! as FactionId;
  const { handleSelectCharacter } = useAppContext();

  const { isEditMode } = useEditMode();
  const [showInput, setShowInput] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when it appears
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = () => {
    if (characterName.trim()) {
      handleCharacterIdChange(
        factionId == 'cat' ? '汤姆' : '杰瑞',
        characterName.trim(),
        factionId,
        handleSelectCharacter,
        true
      );
      setCharacterName('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowInput(false);
      setCharacterName('');
    }
  };

  // Only show in edit mode
  if (!isEditMode) {
    return null;
  }

  return (
    <BaseCard
      variant='character'
      onClick={!showInput ? () => setShowInput(true) : () => {}}
      role='button'
      tabIndex={!showInput ? 0 : -1}
      onKeyDown={
        !showInput
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowInput(true);
              }
            }
          : () => {}
      }
      aria-label='创建新角色'
    >
      {!showInput ? (
        <>
          <div
            className='w-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden mb-4 flex items-center justify-center'
            style={{
              height: containerHeight,
              borderRadius: componentTokens.image.container.borderRadius,
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='text-gray-500 dark:text-gray-400 hover:scale-105'
              style={{
                width: width,
                height: height,
                objectFit: 'contain',
                maxHeight: '50%',
                maxWidth: '70%',
                transition: designTokens.transitions.normal,
              }}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
            </svg>
          </div>
          <div className='px-6 pt-1 pb-6 text-center'>
            <h2 className='text-xl font-bold mb-2 dark:text-white'>创建角色</h2>
          </div>
        </>
      ) : (
        <div
          className='flex flex-col items-stretch justify-center w-full p-4'
          style={{ height: containerHeight }}
        >
          <p className='text-center mb-4 dark:text-gray-200'>请输入角色名称:</p>
          <input
            ref={inputRef}
            type='text'
            className='w-full border border-gray-400 dark:border-gray-600 p-2 rounded dark:bg-slate-700 dark:text-gray-200'
            placeholder='角色名称'
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              // Don't close if clicking on the submit button
              if (e.relatedTarget?.getAttribute('data-submit-button') !== 'true') {
                setTimeout(() => {
                  if (!characterName.trim()) {
                    setShowInput(false);
                  }
                }, 100);
              }
            }}
          />
          <div className='flex justify-end mt-4'>
            <button
              type='button'
              data-submit-button='true'
              aria-label='确认创建角色'
              className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2 dark:bg-blue-600 dark:hover:bg-blue-700'
              onClick={handleSubmit}
              disabled={!characterName.trim()}
            >
              确认创建
            </button>
            <button
              type='button'
              aria-label='取消创建角色'
              className='bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-gray-200'
              onClick={() => {
                setShowInput(false);
                setCharacterName('');
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
