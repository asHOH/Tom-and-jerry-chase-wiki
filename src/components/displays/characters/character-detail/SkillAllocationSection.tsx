import React, { useEffect } from 'react';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import CharacterSection from './CharacterSection';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useCallback } from 'react';
import { saveFactionsAndCharacters, setNestedProperty } from '@/lib/editUtils';
import { SkillAllocation } from '@/data/types';
import { characters } from '@/data';

export const useSkillAllocationManagement = () => {
  const { localCharacter, setLocalCharacter } = useLocalCharacter();
  const handleSaveChanges = useCallback(
    (updatedSkillAllocations: SkillAllocation[]) => {
      setNestedProperty(
        characters,
        `${localCharacter.id}.skillAllocations`,
        updatedSkillAllocations
      );
      saveFactionsAndCharacters();
      setLocalCharacter({ ...localCharacter, skillAllocations: updatedSkillAllocations });
    },
    [localCharacter, setLocalCharacter]
  );

  const handleAddSkillAllocation = useCallback(() => {
    const newAllocationId = `加点方案 ${localCharacter.skillAllocations!.length + 1}`;
    const newAllocation: SkillAllocation = {
      id: newAllocationId,
      pattern: '121212000', // Default pattern
      weaponType: 'weapon1', // Default weapon type
      description: '新增加点方案描述',
    };
    handleSaveChanges([...localCharacter.skillAllocations!, newAllocation]);
  }, [handleSaveChanges, localCharacter.skillAllocations]);

  const handleRemoveSkillAllocation = useCallback(
    (allocationId: string) => {
      handleSaveChanges(
        localCharacter.skillAllocations!.filter((alloc) => alloc.id !== allocationId)
      );
    },
    [handleSaveChanges, localCharacter.skillAllocations]
  );

  return {
    handleAddSkillAllocation,
    handleRemoveSkillAllocation,
  };
};

interface SkillAllocationSectionProps {
  factionId: 'cat' | 'mouse';
}

const SkillAllocationSection: React.FC<SkillAllocationSectionProps> = ({ factionId }) => {
  const { isEditMode } = useEditMode();
  const { localCharacter } = useLocalCharacter();
  const { handleAddSkillAllocation, handleRemoveSkillAllocation } = useSkillAllocationManagement();

  useEffect(() => {
    console.log(localCharacter.skillAllocations, characters[localCharacter.id]!.skillAllocations);
  }, [localCharacter.id, localCharacter.skillAllocations]);
  return (
    <div className='mb-8'>
      <CharacterSection title='推荐加点'>
        <div className='space-y-3'>
          {localCharacter.skillAllocations && localCharacter.skillAllocations.length > 0
            ? localCharacter.skillAllocations.map((allocation, index) => (
                <div key={allocation.id} className='card p-4'>
                  <SkillAllocationDisplay
                    allocation={allocation}
                    factionId={factionId}
                    onRemove={handleRemoveSkillAllocation}
                    index={index}
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
