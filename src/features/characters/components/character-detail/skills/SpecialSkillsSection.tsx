import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useEditMode } from '@/context/EditModeContext';
import { factionData, specialSkills } from '@/data/static';
import { isGeneralSpecialSkill } from '@/features/characters/utils/recommendations';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import RecommendedStorePlansSection from './RecommendedStorePlansSection';

const e = editable('characters');

export default function SpecialSkillsSection() {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const { isEditMode } = useEditMode();
  const editRuntime = useActiveEditRuntime();
  const rawCharacter = editRuntime?.stores.characters[characterId];
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(rawCharacter, publishedCharacter);
  const specialSkillsSnapshot = useOptionalEditSnapshot(
    editRuntime?.stores.specialSkills,
    specialSkills
  );
  const hasSpecialSkills = Boolean(character.specialSkills?.length);
  const hasStorePlans = Boolean(character.recommendedStorePlans?.length);
  if (!hasSpecialSkills && !hasStorePlans && !isEditMode) return null;
  const faction = character.factionId ? factionData[character.factionId] : undefined;

  const insertCustomSkill = () => {
    const skills = rawCharacter!.specialSkills ?? [];
    const generalStartIndex = faction
      ? skills.findIndex((skill) => isGeneralSpecialSkill(skill, faction))
      : -1;
    const insertionIndex = generalStartIndex === -1 ? skills.length : generalStartIndex;

    if (!rawCharacter!.specialSkills) {
      rawCharacter!.specialSkills = [];
    }
    rawCharacter!.specialSkills!.splice(insertionIndex, 0, {
      name: character.factionId === 'cat' ? '绝地反击' : '魔术漂浮',
      description: '',
    });
  };

  return (
    <div>
      {(hasSpecialSkills || isEditMode) && (
        <>
          <h3 className='mt-6 mb-3 border-t border-gray-200 pt-6 text-lg font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-200'>
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
              const isGeneral = faction ? isGeneralSpecialSkill(skill, faction) : false;
              const canEdit = isEditMode && !isGeneral;
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
                        if (isEditMode && !isGeneral) {
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
                            if (isEditMode && !isGeneral) {
                              ev.preventDefault();
                            }
                          }}
                          className='max-w-full'
                        >
                          {canEdit ? (
                            <e.span
                              initialValue={skill.name}
                              path={`specialSkills.${index}.name`}
                              className='text-base font-bold dark:text-white'
                            />
                          ) : (
                            <span className='text-base font-bold dark:text-white'>
                              <TextWithHoverTooltips text={skill.name} />
                            </span>
                          )}
                        </Link>

                        {canEdit && (
                          <IconButton
                            type='button'
                            aria-label='移除特技'
                            onClick={() => rawCharacter!.specialSkills!.splice(index, 1)}
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
                        {canEdit ? (
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
                onClick={insertCustomSkill}
                variant='add'
                size='md'
              >
                <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
            </div>
          )}
        </>
      )}
      <RecommendedStorePlansSection />
    </div>
  );
}
