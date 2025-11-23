import EditableField from '@/components/ui/EditableField';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters, specialSkills } from '@/data';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { useSnapshot } from 'valtio';
import TextWithHoverTooltips from '@/components/displays/characters/shared/TextWithHoverTooltips';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

export default function SpecialSkillsSection() {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const character = useSnapshot(characters[characterId]!);
  if (!character.specialSkills?.length && !isEditMode) return null;
  return (
    <div>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3'>
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
              className='w-full p-3 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
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
                    className='w-8 h-8 rounded-full'
                    width={32}
                    height={32}
                  />
                </Link>

                {/* Right: Title and Description stacked */}
                <div className='flex-1 min-w-0'>
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
                        className='font-bold text-base dark:text-white'
                      />
                    </Link>

                    {isEditMode && (
                      <button
                        type='button'
                        aria-label='移除特技'
                        onClick={() => characters[characterId]!.specialSkills!.splice(index, 1)}
                        className='w-8 h-8 flex items-center justify-center ml-auto bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      >
                        <TrashIcon className='w-4 h-4' aria-hidden='true' />
                      </button>
                    )}
                  </div>

                  <div className='mt-1 text-sm text-gray-500 dark:text-gray-300 whitespace-pre-wrap break-words'>
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
            className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
          >
            <PlusIcon className='w-4 h-4' aria-hidden='true' />
          </button>
        </div>
      )}
    </div>
  );
}
