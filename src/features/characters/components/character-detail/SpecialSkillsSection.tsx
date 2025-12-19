import { useSnapshot } from 'valtio';

import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import EditableField from '@/components/ui/EditableField';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { characters, specialSkills } from '@/data';

export default function SpecialSkillsSection() {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const character = useSnapshot(characters[characterId]!);
  if (!character.specialSkills?.length && !isEditMode) return null;
  return (
    <div>
      <h3 className='mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200'>
        {isEditMode ? (
          '推荐特技'
        ) : (
          <Link href={`/special-skills/advice`} className='hover:underline'>
            推荐特技
          </Link>
        )}
      </h3>
      <ul className='flex flex-col items-center gap-2'>
        {(character.specialSkills ?? []).map((skill, index) => {
          const specialSkill = specialSkills[character.factionId!][skill.name];
          if (!specialSkill && !isEditMode) return null;
          return (
            <li
              key={skill.name + '-' + index}
              className='w-full rounded-md bg-gray-100 p-3 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
            >
              <div className='flex items-start gap-3'>
                {/* Left: Icon (clickable) */}
                <Link
                  href={`/special-skills/${character.factionId}/${skill.name}`}
                  onClick={(ev) => {
                    if (isEditMode) {
                      ev.preventDefault();
                    }
                  }}
                  className='shrink-0'
                >
                  <Image
                    src={specialSkill?.imageUrl ?? '/images/misc/%E7%A6%81%E6%AD%A2.png'}
                    alt={skill.name}
                    className='h-8 w-8 rounded-full'
                    width={32}
                    height={32}
                  />
                </Link>

                {/* Right: Title and Description stacked */}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/special-skills/${character.factionId}/${skill.name}`}
                      onClick={(ev) => {
                        if (isEditMode) {
                          ev.preventDefault();
                        }
                      }}
                      className='max-w-full'
                    >
                      <EditableField
                        tag='span'
                        initialValue={skill.name}
                        path={`specialSkills.${index}.name`}
                        className='text-base font-bold dark:text-white'
                      />
                    </Link>

                    {isEditMode && (
                      <button
                        type='button'
                        aria-label='移除特技'
                        onClick={() => characters[characterId]!.specialSkills!.splice(index, 1)}
                        className='ml-auto flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      >
                        <TrashIcon className='h-4 w-4' aria-hidden='true' />
                      </button>
                    )}
                  </div>

                  <div className='mt-1 text-sm break-words whitespace-pre-wrap text-gray-500 dark:text-gray-300'>
                    {isEditMode ? (
                      <EditableField
                        tag='div'
                        initialValue={skill.description}
                        path={`specialSkills.${index}.description`}
                        className='text-sm text-gray-500 dark:text-gray-300'
                      />
                    ) : (
                      <TextWithHoverTooltips text={skill.description} />
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {isEditMode && (
        <div className='mt-4'>
          <button
            type='button'
            aria-label='添加特技'
            onClick={() => {
              if (!characters[characterId]!.specialSkills) {
                characters[characterId]!.specialSkills = [];
              }
              characters[characterId]!.specialSkills.push({
                name: character.factionId === 'cat' ? '绝地反击' : '魔术漂浮',
                description: '',
              });
            }}
            className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
          >
            <PlusIcon className='h-4 w-4' aria-hidden='true' />
          </button>
        </div>
      )}
    </div>
  );
}
