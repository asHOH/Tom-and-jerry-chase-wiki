import { useEditMode } from '@/context/EditModeContext';
import React, { useState, useRef, useEffect } from 'react';
import BaseCard from '../../../ui/BaseCard';
import { componentTokens, designTokens } from '@/lib/design-tokens';
import json5 from 'json5';
import { CharacterWithFaction } from '@/lib/types';
import { characters, FactionId, factions } from '@/data';
import { addSkillImageUrls } from '@/lib/skillUtils';
import { useAppContext } from '@/context/AppContext';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { saveFactionsAndCharacters } from '@/lib/editUtils';
import { processCharacters } from '@/lib/skillIdUtils';

function handleUploadedData(data: string, factionId: FactionId) {
  let newCharacters: Record<string, CharacterWithFaction>;
  try {
    newCharacters = json5.parse(data);
  } catch (e) {
    void e;
    newCharacters = json5.parse(`{${data}}`);
  }
  // TODO: add faction modification
  for (const character of Object.values(newCharacters)) {
    character.skills = addSkillImageUrls(character.id, character.skills, factionId);
    character.imageUrl = (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(character.id);
    character.factionId = factionId;
    character.faction = {
      id: factionId,
      name: factionId == 'cat' ? '猫阵营' : '鼠阵营',
    };
  }

  newCharacters = processCharacters(newCharacters) as Record<string, CharacterWithFaction>;

  console.log({ newCharacters });

  Object.assign(characters, newCharacters);
  console.log({ characters });

  let needReload = false;

  for (const character of Object.values(newCharacters)) {
    const faction = factions[factionId]!.characters.find(({ id }) => id == character.id);
    if (faction) {
      faction.positioningTags =
        character.catPositioningTags ?? character.mousePositioningTags ?? faction.positioningTags;
    } else {
      factions[factionId]!.characters.push({
        id: character.id,
        name: character.id,
        imageUrl: (factionId == 'cat' ? getCatImageUrl : getMouseImageUrl)(character.id),
        positioningTags: character.catPositioningTags ?? character.mousePositioningTags ?? [],
      });
      needReload = true;
    }
  }

  saveFactionsAndCharacters();

  // since characters and factions is out of reactivity system, force reload to load data
  if (needReload) {
    location.reload();
  }
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
      className='flex flex-col items-stretch justify-center w-full p-4'
      style={{ height: containerHeight }}
    >
      <p className='text-center mb-4'>请将内容粘贴到下方文本框:</p>
      <textarea
        ref={pasteInputRef}
        className='flex-grow w-full border border-gray-400 p-2 resize-none'
        placeholder='在此处粘贴内容...'
        value={textareaContent} // Bind value to state
        onChange={handleTextareaChange} // Use onChange for controlled component
        onKeyDown={(e) => e.stopPropagation()} // Prevent keydown events from bubbling up
      />
      <div className='flex justify-end mt-4'>
        {' '}
        {/* Container for buttons */}
        <button
          className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2'
          onClick={handleSubmit}
        >
          确认上传
        </button>
        <button
          className='bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded'
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
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const factionId = useAppContext().activeTab as FactionId;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          handleUploadedData(content, factionId);
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
        console.log(1);
        const clipboardContent = await navigator.clipboard.readText();
        console.log(2);
        if (!clipboardContent.includes('Error: Clipboard read operation is not allowed.')) {
          handleUploadedData(clipboardContent, factionId);
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
    handleUploadedData(content, factionId);
    setShowPasteInput(false);
  };

  if (!isEditMode) {
    return null;
  }

  return (
    <BaseCard
      variant='character'
      onClick={!showImportOptions && !showPasteInput ? () => setShowImportOptions(true) : () => {}}
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
            className='w-full bg-gray-200 relative overflow-hidden mb-4'
            style={{
              height: containerHeight,
              borderRadius: componentTokens.image.container.borderRadius,
            }}
          >
            <div className='flex items-center justify-center h-full p-2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='size-6 text-gray-500 hover:scale-105'
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
            <h2 className='text-xl font-bold mb-2'>导入角色</h2>
          </div>
        </>
      ) : showImportOptions ? (
        <div
          className='flex flex-col items-stretch justify-center w-full'
          style={{ height: containerHeight }}
        >
          <button
            className='bg-white hover:bg-gray-100 text-black font-bold flex-grow w-full flex items-center justify-center border-b border-gray-400 cursor-pointer text-xl'
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            从文件上传
          </button>
          <button
            className='bg-white hover:bg-gray-100 text-black font-bold flex-grow w-full flex items-center justify-center cursor-pointer text-xl'
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
  );
}
