'use client';

import React, { useCallback } from 'react';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { setNestedProperty } from '@/lib/editUtils';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import { FactionId, SkillAllocation } from '@/data/types';
import Card from '@/components/ui/Card';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PendingActionWarningBoundary } from '@/components/ui/PendingActionWarning';
import { PlusIcon } from '@/components/icons/CommonIcons';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import CharacterSection from '../sections/CharacterSection';
import SkillAllocationDisplay from './SkillAllocationDisplay';

const useSkillAllocationManagement = () => {
  const { characterId } = useLocalCharacter();
  const editRuntime = useDraftDataRuntime();
  const rawCharacter = editRuntime?.stores.characters[characterId];
  const publishedCharacter = usePublishedCharacter(characterId);
  const localCharacter = useOptionalEditSnapshot(rawCharacter, publishedCharacter);
  const handleSaveChanges = useCallback(
    (updatedSkillAllocations: SkillAllocation[]) => {
      if (!rawCharacter || !editRuntime) return;
      setNestedProperty(
        editRuntime.stores.characters,
        `${localCharacter.id}.skillAllocations`,
        updatedSkillAllocations
      );
      editRuntime.stores.characters[localCharacter.id]!.skillAllocations = updatedSkillAllocations;

      // Removed setLocalCharacter call due to missing function.
    },
    [editRuntime, localCharacter.id, rawCharacter]
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
  const editRuntime = useDraftDataRuntime();
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(
    editRuntime?.stores.characters[characterId],
    publishedCharacter
  );
  const skillAllocations = character.skillAllocations ?? [];
  const { handleAddSkillAllocation, handleRemoveSkillAllocation } = useSkillAllocationManagement();

  if (!isEditMode && (!skillAllocations || skillAllocations.length === 0)) {
    return null;
  }

  return (
    <PendingActionWarningBoundary
      descriptors={[{ op: 'set', path: `${character.id}.skillAllocations`, hasNewValue: true }]}
    >
      <CharacterSection title='推荐加点'>
        <div className='space-y-3'>
          {skillAllocations && skillAllocations.length > 0
            ? skillAllocations.map((allocation, index) => (
                <Card key={allocation.id || `allocation-${index}`} className='p-4'>
                  <SkillAllocationDisplay
                    allocation={allocation}
                    factionId={factionId}
                    onRemove={handleRemoveSkillAllocation}
                    index={index}
                  />
                </Card>
              ))
            : isEditMode && (
                <Card className='p-4 text-center text-gray-500 dark:text-gray-400'>
                  暂无推荐加点。点击下方按钮添加。
                </Card>
              )}
          {isEditMode && (
            <div className='mt-4'>
              <IconButton
                type='button'
                aria-label='添加技能加点'
                onClick={handleAddSkillAllocation}
                variant='add'
                size='md'
              >
                <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
            </div>
          )}
        </div>
      </CharacterSection>
    </PendingActionWarningBoundary>
  );
};

export default SkillAllocationSection;
