'use client';

import React, { useCallback } from 'react';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data';
import { FactionId, SkillAllocation } from '@/data/types';
import { useSnapshot } from 'valtio';

import { setNestedProperty } from '@/lib/editUtils';
import { PlusIcon } from '@/components/icons/CommonIcons';

import CharacterSection from './CharacterSection';
import SkillAllocationDisplay from './SkillAllocationDisplay';

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

  const handleAddSkillAllocation = () => {
    if (!localCharacter.skillAllocations) return;
    const newAllocationId = `加点方案 ${localCharacter.skillAllocations.length + 1}`;
    const newAllocation: SkillAllocation = {
      id: newAllocationId,
      pattern: '121212000', // Default pattern
      weaponType: 'weapon1', // Default weapon type
      description: '新增加点方案描述',
    };
    handleSaveChanges([...localCharacter.skillAllocations, newAllocation]);
  };

  const handleRemoveSkillAllocation = (allocationId: string) => {
    if (!localCharacter.skillAllocations) return;
    handleSaveChanges(localCharacter.skillAllocations.filter((alloc) => alloc.id !== allocationId));
  };

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
                  className='card p-4 dark:border-slate-700 dark:bg-slate-800'
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
                <div className='card p-4 text-center text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400'>
                  暂无推荐加点。点击下方按钮添加。
                </div>
              )}
          {isEditMode && (
            <div className='mt-4'>
              <button
                type='button'
                aria-label='添加技能加点'
                onClick={handleAddSkillAllocation}
                className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
              >
                <PlusIcon className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
      </CharacterSection>
    </div>
  );
};

export default SkillAllocationSection;
