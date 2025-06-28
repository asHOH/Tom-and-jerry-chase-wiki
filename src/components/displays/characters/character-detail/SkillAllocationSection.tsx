import React from 'react';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import CharacterSection from './CharacterSection';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { CharacterDetailsProps } from '@/lib/types';
import { useCallback } from 'react';
import { saveFactionsAndCharacters, setNestedProperty } from '@/lib/editUtils';
import { SkillAllocation } from '@/data/types';
import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';

interface UseSkillAllocationManagementProps {
  localCharacter: CharacterDetailsProps['character'];
  setLocalCharacter: React.Dispatch<React.SetStateAction<CharacterDetailsProps['character']>>;
}

export const useSkillAllocationManagement = ({
  localCharacter,
  setLocalCharacter,
}: UseSkillAllocationManagementProps) => {
  const handleSavePattern = useCallback(
    (allocationId: string, newPattern: string) => {
      setLocalCharacter((prevChar) => {
        const updatedSkillAllocations = prevChar.skillAllocations!.map((alloc) =>
          alloc.id === allocationId ? { ...alloc, pattern: newPattern } : alloc
        );
        setNestedProperty(
          characters,
          `${localCharacter.id}.skillAllocations`,
          updatedSkillAllocations
        );
        saveFactionsAndCharacters();
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  const handleSaveName = useCallback(
    (allocationId: string, newName: string) => {
      setLocalCharacter((prevChar) => {
        const updatedSkillAllocations = prevChar.skillAllocations!.map((alloc) =>
          alloc.id === allocationId ? { ...alloc, id: newName } : alloc
        );
        setNestedProperty(
          characters,
          `${localCharacter.id}.skillAllocations`,
          updatedSkillAllocations
        );
        saveFactionsAndCharacters();
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  const handleSaveDescription = useCallback(
    (allocationId: string, newDescription: string) => {
      setLocalCharacter((prevChar) => {
        const updatedSkillAllocations = prevChar.skillAllocations!.map((alloc) =>
          alloc.id === allocationId ? { ...alloc, description: newDescription } : alloc
        );
        setNestedProperty(
          characters,
          `${localCharacter.id}.skillAllocations`,
          updatedSkillAllocations
        );
        saveFactionsAndCharacters();
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  const handleSaveAdditionalDescription = useCallback(
    (allocationId: string, newAdditionalDescription: string) => {
      setLocalCharacter((prevChar) => {
        const updatedSkillAllocations = prevChar.skillAllocations!.map((alloc) =>
          alloc.id === allocationId
            ? { ...alloc, additionaldescription: newAdditionalDescription }
            : alloc
        );
        setNestedProperty(
          characters,
          `${localCharacter.id}.skillAllocations`,
          updatedSkillAllocations
        );
        saveFactionsAndCharacters();
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  const handleAddSkillAllocation = useCallback(() => {
    setLocalCharacter((char) => {
      const prevChar = structuredClone(char);
      const newAllocationId = `加点方案 ${prevChar.skillAllocations!.length + 1}`;
      const newAllocation: SkillAllocation = {
        id: newAllocationId,
        pattern: '121212000', // Default pattern
        weaponType: 'weapon1', // Default weapon type
        description: '新增加点方案描述',
      };
      setNestedProperty(characters, `${localCharacter.id}.skillAllocations`, [
        ...prevChar.skillAllocations!,
        newAllocation,
      ]);
      saveFactionsAndCharacters();
      return {
        ...prevChar,
        skillAllocations: [...prevChar.skillAllocations!, newAllocation],
      };
    });
  }, [localCharacter.id, setLocalCharacter]);

  const handleRemoveSkillAllocation = useCallback(
    (allocationId: string) => {
      setLocalCharacter((prevChar) => {
        const updatedSkillAllocations = prevChar.skillAllocations!.filter(
          (alloc) => alloc.id !== allocationId
        );
        setNestedProperty(
          characters,
          `${localCharacter.id}.skillAllocations`,
          updatedSkillAllocations
        );
        saveFactionsAndCharacters();
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  return {
    handleSavePattern,
    handleSaveName,
    handleSaveDescription,
    handleSaveAdditionalDescription,
    handleAddSkillAllocation,
    handleRemoveSkillAllocation,
  };
};

interface SkillAllocationSectionProps {
  factionId: 'cat' | 'mouse';
}

const SkillAllocationSection: React.FC<SkillAllocationSectionProps> = ({ factionId }) => {
  const { isEditMode } = useEditMode();
  const { isDetailedView } = useAppContext();
  const { localCharacter, setLocalCharacter } = useLocalCharacter();
  const {
    handleSavePattern,
    handleSaveName,
    handleSaveDescription,
    handleSaveAdditionalDescription,
    handleAddSkillAllocation,
    handleRemoveSkillAllocation,
  } = useSkillAllocationManagement({ localCharacter, setLocalCharacter });

  return (
    <div className='mb-8'>
      <CharacterSection title='推荐加点'>
        <div className='space-y-3'>
          {localCharacter.skillAllocations && localCharacter.skillAllocations.length > 0
            ? localCharacter.skillAllocations.map((allocation) => (
                <div key={allocation.id} className='card p-4'>
                  <SkillAllocationDisplay
                    allocation={allocation}
                    characterName={localCharacter.id}
                    factionId={factionId}
                    characterSkills={localCharacter.skills}
                    isDetailed={isDetailedView}
                    onSavePattern={handleSavePattern}
                    onSaveName={handleSaveName}
                    onSaveDescription={handleSaveDescription}
                    onSaveAdditionalDescription={handleSaveAdditionalDescription}
                    onRemove={handleRemoveSkillAllocation}
                  />
                </div>
              ))
            : isEditMode && (
                <div className='card p-4 text-center text-gray-500'>
                  暂无推荐加点。点击下方按钮添加。
                </div>
              )}
          {isEditMode && (
            <div className='mt-4'>
              <button
                onClick={handleAddSkillAllocation}
                className='w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                  className='w-4 h-4'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
                </svg>
              </button>
            </div>
          )}
        </div>
      </CharacterSection>
    </div>
  );
};

export default SkillAllocationSection;
