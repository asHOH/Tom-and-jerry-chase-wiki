import React from 'react';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import CharacterSection from './CharacterSection';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterDetailsProps } from '@/lib/types';
import { useCallback } from 'react';
import { updateEditableField } from '@/lib/editUtils';
import { SkillAllocation } from '@/data/types';

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
        updateEditableField(`${localCharacter.id}.skillAllocations`, updatedSkillAllocations);
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
        updateEditableField(`${localCharacter.id}.skillAllocations`, updatedSkillAllocations);
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
        updateEditableField(`${localCharacter.id}.skillAllocations`, updatedSkillAllocations);
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
        updateEditableField(`${localCharacter.id}.skillAllocations`, updatedSkillAllocations);
        return { ...prevChar, skillAllocations: updatedSkillAllocations };
      });
    },
    [localCharacter.id, setLocalCharacter]
  );

  const handleAddSkillAllocation = useCallback(() => {
    setLocalCharacter((prevChar) => {
      const newAllocationId = `加点方案 ${prevChar.skillAllocations!.length + 1}`;
      const newAllocation: SkillAllocation = {
        id: newAllocationId,
        pattern: '121212000', // Default pattern
        weaponType: 'weapon1', // Default weapon type
        description: '新增加点方案描述',
      };
      updateEditableField(`${localCharacter.id}.skillAllocations`, [
        ...prevChar.skillAllocations!,
        newAllocation,
      ]);
      return {
        ...prevChar,
        skillAllocations: [...prevChar.skillAllocations!, newAllocation],
      };
    });
  }, [localCharacter.id, setLocalCharacter]);

  return {
    handleSavePattern,
    handleSaveName,
    handleSaveDescription,
    handleSaveAdditionalDescription,
    handleAddSkillAllocation,
  };
};

interface SkillAllocationSectionProps {
  localCharacter: CharacterDetailsProps['character'];
  setLocalCharacter: React.Dispatch<React.SetStateAction<CharacterDetailsProps['character']>>;
  isDetailedView: boolean;
  factionId: 'cat' | 'mouse';
}

const SkillAllocationSection: React.FC<SkillAllocationSectionProps> = ({
  localCharacter,
  setLocalCharacter,
  isDetailedView,
  factionId,
}) => {
  const { isEditMode } = useEditMode();
  const {
    handleSavePattern,
    handleSaveName,
    handleSaveDescription,
    handleSaveAdditionalDescription,
    handleAddSkillAllocation,
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
                  />
                </div>
              ))
            : isEditMode && (
                <div className='card p-4 text-center text-gray-500'>
                  暂无推荐加点。点击下方按钮添加。
                </div>
              )}
          {isEditMode && (
            <button
              onClick={handleAddSkillAllocation}
              className='mt-4 w-full flex items-center justify-center bg-blue-500 text-white rounded-md py-2 text-sm hover:bg-blue-600'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                className='w-5 h-5 mr-2'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
              </svg>
              添加新加点
            </button>
          )}
        </div>
      </CharacterSection>
    </div>
  );
};

export default SkillAllocationSection;
