'use client';

import React from 'react';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import CharacterSection from './CharacterSection';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useCallback } from 'react';
import { setNestedProperty } from '@/lib/editUtils';
import { SkillAllocation, FactionId } from '@/data/types';
import { characters } from '@/data';
import { useSnapshot } from 'valtio';

export const useSkillAllocationManagement = () => {
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const handleSaveChanges = useCallback(
    (updatedSkillAllocations: SkillAllocation[]) => {
      if (!localCharacter) return;
      setNestedProperty(
        characters,
        `${localCharacter.id}.skillAllocations`,
        updatedSkillAllocations
      );
      characters[localCharacter.id]!.skillAllocations = updatedSkillAllocations;

      // Removed setLocalCharacter call due to missing function.
    },
    [localCharacter]
  );

  const handleAddSkillAllocation = useCallback(() => {
    if (!localCharacter.skillAllocations) return;
    const newAllocationId = `加点方案 ${localCharacter.skillAllocations.length + 1}`;
    const newAllocation: SkillAllocation = {
      id: newAllocationId,
      pattern: '121212000', // Default pattern
      weaponType: 'weapon1', // Default weapon type
      description: '新增加点方案描述',
    };
    handleSaveChanges([...localCharacter.skillAllocations, newAllocation]);
  }, [handleSaveChanges, localCharacter?.skillAllocations]);

  const handleRemoveSkillAllocation = useCallback(
    (allocationId: string) => {
      if (!localCharacter.skillAllocations) return;
      handleSaveChanges(
        localCharacter.skillAllocations.filter((alloc) => alloc.id !== allocationId)
      );
    },
    [handleSaveChanges, localCharacter?.skillAllocations]
  );

  return {
    handleAddSkillAllocation,
    handleRemoveSkillAllocation,
  };
};

interface SkillAllocationSectionProps {
  factionId: FactionId;
}

const SkillAllocationSection: React.FC<SkillAllocationSectionProps> = ({ factionId }) => {
  const { isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const skillAllocations = useSnapshot(characters[characterId]?.skillAllocations ?? []);
  const { handleAddSkillAllocation, handleRemoveSkillAllocation } = useSkillAllocationManagement();
  return (
    <div>
      <CharacterSection title='推荐加点'>
        <div className='space-y-3'>
          {skillAllocations && skillAllocations.length > 0
            ? skillAllocations.map((allocation, index) => (
                <div
                  key={allocation.id || `allocation-${index}`}
                  className='card dark:bg-slate-800 dark:border-slate-700 p-4'
                >
                  <SkillAllocationDisplay
                    allocation={allocation}
                    factionId={factionId}
                    onRemove={handleRemoveSkillAllocation}
                    index={index}
                  />
                </div>
              ))
            : isEditMode && (
                <div className='card dark:bg-slate-800 dark:border-slate-700 p-4 text-center text-gray-500 dark:text-gray-400'>
                  暂无推荐加点。点击下方按钮添加。
                </div>
              )}
          {isEditMode && (
            <div className='mt-4'>
              <button
                type='button'
                aria-label='添加技能加点'
                onClick={handleAddSkillAllocation}
                className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
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
