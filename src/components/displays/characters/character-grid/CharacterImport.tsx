'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import { characters, FactionId, factions } from '@/data';
import json5 from 'json5';
import { proxy } from 'valtio';

import { AssetManager } from '@/lib/assetManager';
import { GameDataManager } from '@/lib/dataManager';
import { componentTokens, designTokens } from '@/lib/design-tokens';
import { processCharacters } from '@/lib/skillIdUtils';
import { CharacterWithFaction } from '@/lib/types';

import BaseCard from '../../../ui/BaseCard';

function handleUploadedData(
  data: string,
  factionId: FactionId,
  onImportSuccess: (names: string[]) => void
) {
  let newCharacters: Record<string, CharacterWithFaction>;
  try {
    newCharacters = json5.parse(`{${data}}`);
  } catch (e) {
    console.error('Failed to parse uploaded character data in Character Import:', e);
    newCharacters = json5.parse(data);
  }

  const importedNames: string[] = [];

  // Enhance each character with complete data structure
  for (const [characterId, character] of Object.entries(newCharacters)) {
    // Ensure character has id field
    if (!character.id) {
      character.id = characterId;
    }

    importedNames.push(character.id);

    // Add skill image URLs
    character.skills = AssetManager.addSkillImageUrls(character.id, character.skills, factionId);
    character.imageUrl = AssetManager.getCharacterImageUrl(character.id, factionId);
    character.factionId = factionId;

    console.log(`Enhanced imported character ${character.id} with complete data structure`);
  }

  newCharacters = processCharacters(newCharacters) as Record<string, CharacterWithFaction>;

  // Update the global characters object
  for (const [id, value] of Object.entries(newCharacters)) {
    // Use proxies so sub-reads via useSnapshot work on nested structures
    characters[id] = proxy(value);
  }

  for (const character of Object.values(newCharacters)) {
    const faction = factions[factionId]!.characters.find(({ id }) => id == character.id);
    if (faction) {
      faction.positioningTags =
        character.catPositioningTags ?? character.mousePositioningTags ?? faction.positioningTags;
    } else {
      factions[factionId]!.characters.push({
        id: character.id,
        name: character.id,
        imageUrl: AssetManager.getCharacterImageUrl(character.id, factionId),
        positioningTags: character.catPositioningTags ?? character.mousePositioningTags ?? [],
      });
    }
  }

  // Trigger success callback - no reload needed, let's see if UI updates automatically
  GameDataManager.invalidate({ characters: true, factions: true });
  onImportSuccess(importedNames);
}

interface PasteInputModalProps {
  onPaste: (content: string) => void;
  onCancel: () => void;
  containerHeight: string | number;
}

const PasteInputModal: React.FC<PasteInputModalProps> = ({
  onPaste,
  onCancel,
  containerHeight,
}) => {
  const pasteInputRef = useRef<HTMLTextAreaElement>(null);
  const [textareaContent, setTextareaContent] = useState('');

  useEffect(() => {
    // Focus the textarea when the modal appears
    if (pasteInputRef.current) {
      pasteInputRef.current.focus();
    }
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaContent(e.target.value);
  };

  const handleSubmit = () => {
    if (textareaContent) {
      onPaste(textareaContent); // Call the parent's onPaste with the collected content
    }
    onCancel(); // Close the modal after submission (or cancellation)
  };

  return (
    <div
      className='flex w-full flex-col items-stretch justify-center p-4 dark:text-gray-200'
      style={{ height: containerHeight }}
    >
      <p className='mb-4 text-center'>请将内容粘贴到下方文本框:</p>
      <textarea
        ref={pasteInputRef}
        className='w-full flex-grow resize-none border border-gray-400 p-2 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-200'
        placeholder='在此处粘贴内容...'
        value={textareaContent} // Bind value to state
        onChange={handleTextareaChange} // Use onChange for controlled component
        onKeyDown={(e) => e.stopPropagation()} // Prevent keydown events from bubbling up
      />
      <div className='mt-4 flex justify-end'>
        {' '}
        {/* Container for buttons */}
        <button
          type='button'
          aria-label='确认上传角色数据'
          className='mr-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          onClick={handleSubmit}
        >
          确认上传
        </button>
        <button
          type='button'
          aria-label='取消上传角色数据'
          className='rounded bg-gray-200 px-4 py-2 font-bold text-black hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500'
          onClick={onCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default function CharacterImport() {
  const { width, height } = componentTokens.image.dimensions.CHARACTER_CARD;
  const containerHeight = componentTokens.image.container.height;

  const { isEditMode } = useEditMode();
  const { handleSelectCharacter } = useAppContext();
  const { success } = useToast();
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const factionId = params?.factionId as FactionId;

  const handleImportSuccess = (names: string[]) => {
    // Create the notification message
    const message = `成功导入${names.map((name, index) => `${index > 0 ? '、' : ''}${name}`).join('')}，即将打开页面开始编辑...`;
    success(message, 1500);

    // Navigate to the first imported character after a delay
    setTimeout(() => {
      if (names.length > 0) {
        const firstCharacterName = names[0];
        if (firstCharacterName) {
          handleSelectCharacter(firstCharacterName);
        }
      }
    }, 1500);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const suffix = file.name.split('.').pop()?.toLowerCase();
      if (suffix !== 'ts' && suffix !== 'txt') {
        console.error('Unsupported file type. Please upload a .ts or .txt file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          handleUploadedData(content, factionId, handleImportSuccess);
          setShowImportOptions(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const clipboardContent = await navigator.clipboard.readText();
        if (!clipboardContent.includes('Error: Clipboard read operation is not allowed.')) {
          handleUploadedData(clipboardContent, factionId, handleImportSuccess);
          setShowImportOptions(false);
        } else {
          setShowImportOptions(false);
          setShowPasteInput(true);
        }
      } catch (err) {
        console.error('Failed to read clipboard contents directly, prompting user to paste: ', err);
        setShowImportOptions(false);
        setShowPasteInput(true);
      }
    } else {
      console.warn('Clipboard API not available, prompting user to paste.');
      setShowImportOptions(false);
      setShowPasteInput(true);
    }
  };

  const handlePasteModalContent = (content: string) => {
    handleUploadedData(content, factionId, handleImportSuccess);
    setShowPasteInput(false);
  };

  if (!isEditMode) {
    return null;
  }

  return (
    <>
      <BaseCard
        variant='character'
        onClick={
          !showImportOptions && !showPasteInput ? () => setShowImportOptions(true) : () => {}
        }
        role='button'
        tabIndex={!showImportOptions && !showPasteInput ? 0 : -1} // Make it unfocusable when options or paste input are shown
        onKeyDown={
          !showImportOptions && !showPasteInput
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowImportOptions(true);
                }
              }
            : () => {}
        }
        aria-label='导入新角色'
      >
        {!showImportOptions && !showPasteInput ? (
          <>
            <div
              className='relative mb-4 w-full overflow-hidden bg-gray-200 dark:bg-slate-700'
              style={{
                height: containerHeight,
                borderRadius: componentTokens.image.container.borderRadius,
              }}
            >
              <div className='flex h-full items-center justify-center p-2'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='size-6 text-gray-500 hover:scale-105 dark:text-gray-400'
                  style={{
                    width: width,
                    height: height,
                    objectFit: 'contain',
                    maxHeight: '50%',
                    maxWidth: '70%',
                    transition: designTokens.transitions.normal,
                  }}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'
                  />
                </svg>
              </div>
            </div>
            <div className='px-6 pt-1 pb-6 text-center'>
              <h2 className='mb-2 text-xl font-bold dark:text-white'>导入角色</h2>
            </div>
          </>
        ) : showImportOptions ? (
          <div
            className='flex w-full flex-col items-stretch justify-center'
            style={{ height: containerHeight }}
          >
            <button
              type='button'
              aria-label='从文件上传角色数据'
              className='flex w-full flex-grow cursor-pointer items-center justify-center border-b border-gray-400 bg-white text-xl font-bold text-black hover:bg-gray-100 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              从文件上传
            </button>
            <button
              type='button'
              aria-label='从剪贴板上传角色数据'
              className='flex w-full flex-grow cursor-pointer items-center justify-center bg-white text-xl font-bold text-black hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
              onClick={handlePasteClick}
            >
              从剪贴板上传
            </button>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept='.ts,.txt' // Specify accepted file types if needed
              aria-label='上传角色数据文件'
            />
          </div>
        ) : (
          <PasteInputModal
            onPaste={handlePasteModalContent}
            onCancel={() => setShowPasteInput(false)}
            containerHeight={containerHeight}
          />
        )}
      </BaseCard>
    </>
  );
}
