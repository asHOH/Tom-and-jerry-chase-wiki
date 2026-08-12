'use client';

import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { SpecialSkillCharacterLookup } from '@/lib/gameData/published/clientProjections';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalSpecialSkill } from '@/hooks/useLocalEditEntity';
import { useSpecifyTypeKeyboardNavigation } from '@/hooks/useSpecifyTypeKeyboardNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { characters } from '@/data/static';
import { SpecialSkill } from '@/data/types';
import CharacterList from '@/features/knowledge-cards/components/knowledge-card-detail/CharacterList';
import DetailOwnbuffsCard from '@/features/shared/detail-view/DetailOwnbuffsCard';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailShell, { DetailSection } from '@/features/shared/detail-view/DetailShell';
import DetailTextSection from '@/features/shared/detail-view/DetailTextSection';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import { editable } from '@/components/ui/editable';

import SpecialSkillAttributesCard from './SpecialSkillAttributesCard';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
  charactersData?: SpecialSkillCharacterLookup;
}

export default function SpecialSkillDetailClient({
  skill,
  charactersData = characters,
}: SpecialSkillDetailClientProps) {
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { factionId, skillId } = useLocalSpecialSkill();
  const ed = editable('specialSkills');
  const editRuntime = useDraftDataRuntime();

  const rawLocalSkill =
    factionId === 'cat'
      ? editRuntime?.stores.specialSkills.cat[skillId]
      : factionId === 'mouse'
        ? editRuntime?.stores.specialSkills.mouse[skillId]
        : undefined;
  const localSkillSnapshot = useOptionalEditSnapshot(rawLocalSkill, skill);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveSkill =
    usesDraftData && rawLocalSkill ? (localSkillSnapshot as SpecialSkill) : skill;

  // Keyboard navigation
  useSpecifyTypeKeyboardNavigation(
    effectiveSkill.name,
    'specialSkill',
    effectiveSkill.factionId == 'cat' ? false : true
  );

  const { isDetailedView } = useAppContext();
  const charactersSnap = useOptionalEditSnapshot<SpecialSkillCharacterLookup>(
    editRuntime?.stores.characters,
    charactersData
  );

  if (!effectiveSkill) return null;

  const usedCharacters = Object.values(charactersSnap).filter(
    (character) =>
      character.specialSkills?.some((s) => s.name === effectiveSkill.name) &&
      character.factionId === effectiveSkill.factionId
  );

  const unusedCharacters = Object.values(charactersSnap).filter(
    (character) =>
      !character.specialSkills?.some((s) => s.name === effectiveSkill.name) &&
      character.factionId === effectiveSkill.factionId
  );

  const displayUsedCharacters = usedCharacters.length <= unusedCharacters.length;

  // Generate faction-specific title
  const factionName = effectiveSkill.factionId === 'cat' ? '猫方' : '鼠方';

  const getCharacterSectionTitle = () => {
    if (usedCharacters.length === 0) {
      return `没有${factionName}角色使用该特技`;
    } else if (unusedCharacters.length === 0) {
      return `所有${factionName}角色均使用该特技`;
    } else {
      return displayUsedCharacters
        ? `使用该特技的${factionName}角色`
        : `未使用该特技的${factionName}角色`;
    }
  };

  const sections: DetailSection[] = [
    {
      key: 'description',
      content: (
        <DetailTextSection
          title='技能描述'
          value={effectiveSkill.description}
          detailedValue={effectiveSkill.detailedDescription}
          isDetailedView={isDetailedView}
          renderValue={
            isEditMode ? (
              <ed.span
                path={isDetailedView ? 'detailedDescription' : 'description'}
                initialValue={
                  isDetailedView
                    ? (effectiveSkill.detailedDescription ?? effectiveSkill.description ?? '')
                    : (effectiveSkill.description ?? '')
                }
              />
            ) : undefined
          }
        >
          <div className='-mt-4 space-y-2'>
            <DetailTraitsCard
              singleItem={{
                name: effectiveSkill.name,
                type: 'specialSkill',
                factionId: effectiveSkill.factionId,
              }}
            />
            <DetailReverseCard
              singleItem={{
                name: effectiveSkill.name,
                type: 'specialSkill',
                factionId: effectiveSkill.factionId,
              }}
            />
            <DetailOwnbuffsCard
              singleItem={{
                name: effectiveSkill.name,
                type: 'specialSkill',
                factionId: effectiveSkill.factionId,
              }}
            />
          </div>
        </DetailTextSection>
      ),
    },
    ...(isEditMode || effectiveSkill.adviceDescription !== undefined
      ? [
          {
            key: 'advice',
            content: (
              <DetailTextSection
                title='使用建议'
                value={effectiveSkill.adviceDescription}
                detailedValue={null}
                isDetailedView={isDetailedView}
                renderValue={
                  isEditMode ? (
                    <ed.span
                      path='adviceDescription'
                      initialValue={effectiveSkill.adviceDescription ?? '<无内容>'}
                      deleteOnEmpty
                    />
                  ) : undefined
                }
              />
            ),
          },
        ]
      : []),
    {
      title: getCharacterSectionTitle(),
      content: (
        <CharacterList
          characters={displayUsedCharacters ? usedCharacters : unusedCharacters}
          showList={usedCharacters.length > 0 && unusedCharacters.length > 0}
        />
      ),
    },
  ];

  return (
    <DetailShell
      leftColumn={<SpecialSkillAttributesCard skill={effectiveSkill} />}
      sections={sections}
      rightColumnProps={{ style: { whiteSpace: 'pre-wrap' } }}
    />
  );
}
