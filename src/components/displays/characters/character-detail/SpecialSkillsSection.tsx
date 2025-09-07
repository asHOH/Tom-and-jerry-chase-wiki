import EditableField from '@/components/ui/EditableField';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters, specialSkills } from '@/data';
import Image from '@/components/Image';
import Link from 'next/link';
import { useSnapshot } from 'valtio';
import TextWithHoverTooltips from '@/components/displays/characters/shared/TextWithHoverTooltips';

export default function SpecialSkillsSection() {
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const character = useSnapshot(characters[characterId]!);
  if (!character.specialSkills?.length && !isEditMode) return null;
  return (
    <div>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3'>推荐特技</h3>
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
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='2'
                          stroke='currentColor'
                          className='w-4 h-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                          />
                        </svg>
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
  );
}
