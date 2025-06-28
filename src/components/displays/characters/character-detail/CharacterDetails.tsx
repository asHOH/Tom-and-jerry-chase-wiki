import React from 'react';
import Image from 'next/image';
import { CharacterDetailsProps } from '@/lib/types';
import { Skill } from '@/data/types';
import SkillAllocationDisplay from './SkillAllocationDisplay';
import PositioningTagsSection from './PositioningTagsSection';
import CharacterAttributesSection from './CharacterAttributesSection';
import SkillCard from './SkillCard';
import KnowledgeCardManager from './KnowledgeCardManager';
import { useCallback, useState, useEffect } from 'react';
import EditableField from '@/components/ui/EditableField';
import CharacterSection from './CharacterSection';
import { useEditMode } from '@/context/EditModeContext';
import { updateEditableField } from '@/lib/editUtils';

export default function CharacterDetails({
  character,
  isDetailedView: propIsDetailedView,
}: CharacterDetailsProps) {
  const { isEditMode } = useEditMode();
  const [copyMessage, setCopyMessage] = useState('');
  const isDetailedView = propIsDetailedView || false;
  const [localCharacter, setLocalCharacter] = useState(character);
  const factionId = localCharacter.faction.id as 'cat' | 'mouse';

  const positioningTags =
    factionId === 'cat'
      ? localCharacter.catPositioningTags || []
      : localCharacter.mousePositioningTags || [];

  useEffect(() => {
    setLocalCharacter(character);
  }, [character]);

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
    [localCharacter.id]
  );

  const handleAddSkillAllocation = useCallback(() => {
    setLocalCharacter((prevChar) => {
      const newAllocationId = `加点方案 ${prevChar.skillAllocations!.length + 1}`;
      const newAllocation = {
        id: newAllocationId,
        pattern: '121212000', // Default pattern
        weaponType: 'weapon1' as const, // Default weapon type
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
  }, [localCharacter.id]);

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row gap-8'>
        <div className='md:w-1/3'>
          <div className='card h-full'>
            <div className='w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4 image-container'>
              <div className='flex items-center justify-center h-full p-3'>
                <Image
                  src={localCharacter.imageUrl}
                  alt={character.id}
                  width={200}
                  height={200}
                  unoptimized
                  style={{
                    objectFit: 'contain',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
            <h1 className='text-3xl font-bold py-2 flex items-center justify-between'>
              <div>
                <EditableField
                  tag='span'
                  path={`${localCharacter.id}.id`}
                  initialValue={localCharacter.id}
                  className='inline'
                />{' '}
                <span className='text-xl font-normal text-gray-400'>
                  ({localCharacter.faction.name})
                </span>
              </div>
              {isEditMode && (
                <button
                  onClick={async () => {
                    const data = localStorage.getItem('editableFields');
                    if (data) {
                      try {
                        await navigator.clipboard.writeText(
                          JSON.stringify({
                            [localCharacter.id]: JSON.parse(data)[localCharacter.id],
                          })
                        );
                        setCopyMessage('已复制！');
                        setTimeout(() => setCopyMessage(''), 2000);
                      } catch (err) {
                        console.error('Failed to copy: ', err);
                        setCopyMessage('复制失败');
                        setTimeout(() => setCopyMessage(''), 2000);
                      }
                    } else {
                      setCopyMessage('无数据可导出');
                      setTimeout(() => setCopyMessage(''), 2000);
                    }
                  }}
                  className='ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                >
                  {copyMessage || '导出数据'}
                </button>
              )}
            </h1>

            <EditableField
              tag='p'
              path={`${localCharacter.id}.description`}
              initialValue={localCharacter.description}
              className='text-gray-700 mt-2 py-1'
            />

            <div className='mt-6 space-y-3'>
              <CharacterAttributesSection
                character={localCharacter}
                factionId={factionId}
                isDetailed={isDetailedView}
              />

              <PositioningTagsSection
                tags={positioningTags}
                factionId={factionId}
                isDetailed={isDetailedView}
                characterId={localCharacter.id}
              />
            </div>
          </div>
        </div>

        <div className='md:w-2/3'>
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
                          onSavePattern={(newPattern) =>
                            handleSavePattern(allocation.id, newPattern)
                          }
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
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 4.5v15m7.5-7.5h-15'
                      />
                    </svg>
                    添加新加点
                  </button>
                )}
              </div>
            </CharacterSection>
          </div>

          <KnowledgeCardManager factionId={factionId} character={localCharacter} />

          <CharacterSection title='技能描述'>
            <div className='space-y-6'>
              {(() => {
                const weaponSkills = localCharacter.skills.filter(
                  (skill) => skill.type === 'weapon1' || skill.type === 'weapon2'
                );
                const isSingleWeapon = weaponSkills.length === 1;

                return localCharacter.skills.map((skill, index) => (
                  <SkillCard
                    key={(skill as Skill).id}
                    skill={skill as Skill}
                    isDetailed={isDetailedView}
                    isSingleWeapon={isSingleWeapon && skill.type === 'weapon1'}
                    characterId={localCharacter.id}
                    skillIndex={index}
                  />
                ));
              })()}
            </div>
          </CharacterSection>
        </div>
      </div>
    </div>
  );
}
