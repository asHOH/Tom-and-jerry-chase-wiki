import { useSnapshot } from 'valtio';

import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { characters, specialSkillsEdit } from '@/data';

const e = editable('characters');

export default function SpecialSkillsSection() {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const character = useSnapshot(characters[characterId]!);
  const specialSkillsSnapshot = useSnapshot(specialSkillsEdit);
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
          const specialSkill = specialSkillsSnapshot[character.factionId!][skill.name];
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
                      <e.span
                        initialValue={skill.name}
                        path={`specialSkills.${index}.name`}
                        className='text-base font-bold dark:text-white'
                      />
                    </Link>

                    {isEditMode && (
                      <IconButton
                        type='button'
                        aria-label='移除特技'
                        onClick={() => characters[characterId]!.specialSkills!.splice(index, 1)}
                        variant='delete'
                        size='md'
                        className='ml-auto'
                      >
                        <TrashIcon
                          className={getIconButtonIconClassName('md')}
                          aria-hidden='true'
                        />
                      </IconButton>
                    )}
                  </div>

                  <div className='mt-1 text-sm break-words whitespace-pre-wrap text-gray-500 dark:text-gray-300'>
                    {isEditMode ? (
                      <e.div
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
          <IconButton
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
            variant='add'
            size='md'
          >
            <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
          </IconButton>
        </div>
      )}
    </div>
  );
}
