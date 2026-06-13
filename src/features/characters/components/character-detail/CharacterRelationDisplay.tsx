'use client';

import React from 'react';
import { useSnapshot } from 'valtio';

import { AssetManager } from '@/lib/assetManager';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { characters, mapsEdit, modesEdit, specialSkillsEdit } from '@/data/store';
import type { CharacterRelationItem, FactionId, TraitRelationKind } from '@/data/types';
import {
  addCharacterRelationItem,
  createCharacterRelationItem,
  getCharacterRelationDescriptionPath,
  getEditableCharacterRelations,
  removeCharacterRelationItem,
  toggleCharacterRelationMinor,
  updateCharacterRelationDescription,
} from '@/features/characters/utils/characterRelationOverlay';
import { CharacterSelector } from '@/components/ui/CharacterSelector';

import {
  AdvantageIcon,
  DisadvantageIcon,
  HappyFaceIcon,
  HeartIcon,
  MapIcon,
  NeutralFaceIcon,
  SadFaceIcon,
} from './CharacterRelationIcons';
import { createEditableRelationItemOptions } from './characterRelationItemOptions';
import CharacterRelationPanel, {
  type CharacterRelationPanelSection,
} from './CharacterRelationPanel';
import {
  buildCharacterItems,
  buildKnowledgeCardItems,
  buildMapItems,
  buildModeItems,
  buildSpecialSkillItems,
  sortByImportance,
} from './characterRelationViewModel';
import KnowledgeCardSelector from './KnowledgeCardSelector';
import MapSelector from './MapSelector';
import ModeSelector from './ModeSelector';
import SpecialSkillSelector from './SpecialSkillSelector';

type Props = {
  id: string;
  factionId: FactionId;
};

const CharacterRelationDisplay: React.FC<Props> = ({ id, factionId }) => {
  'use no memo';
  const { isEditMode } = useEditMode();
  const mapsSnapshot = useSnapshot(mapsEdit);
  const modesSnapshot = useSnapshot(modesEdit);
  const specialSkillsSnapshot = useSnapshot(specialSkillsEdit);
  const getImageUrl = React.useCallback(
    (targetId: string) =>
      AssetManager.getCharacterImageUrl(targetId, factionId === 'cat' ? 'mouse' : 'cat'),
    [factionId]
  );
  const characterSnapshot = useSnapshot(characters[id]!);
  const char = getEditableCharacterRelations(
    id,
    characterSnapshot as Partial<Record<TraitRelationKind, CharacterRelationItem[]>>
  );
  const { handleSelectCharacter } = useAppContext();
  const { navigate } = useNavigation();

  const oppositeFactionId = factionId === 'cat' ? 'mouse' : 'cat';
  const createRelationOptions = (relationKind: TraitRelationKind) =>
    createEditableRelationItemOptions({
      characterId: id,
      relationKind,
      getDescriptionPath: getCharacterRelationDescriptionPath,
      onToggleMinor: toggleCharacterRelationMinor,
      onRemove: removeCharacterRelationItem,
      onUpdateDescription: updateCharacterRelationDescription,
    });

  const countersItems = sortByImportance([
    ...buildCharacterItems(
      char.counters,
      getImageUrl,
      handleSelectCharacter,
      {
        view: (targetId: string) => `选择角色 ${targetId}`,
        edit: (targetId: string) => `克制 ${targetId} 的关系`,
      },
      createRelationOptions('counters')
    ),
    ...buildKnowledgeCardItems(
      char.countersKnowledgeCards,
      (cardId: string) => navigate(`/cards/${encodeURIComponent(cardId)}`),
      createRelationOptions('countersKnowledgeCards')
    ),
    ...buildSpecialSkillItems(
      char.countersSpecialSkills,
      (skillId: string) =>
        navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
      oppositeFactionId,
      specialSkillsSnapshot as unknown as Record<FactionId, Record<string, { imageUrl?: string }>>,
      createRelationOptions('countersSpecialSkills')
    ),
  ]);

  const counterEachOtherItems = sortByImportance(
    buildCharacterItems(
      char.counterEachOther,
      getImageUrl,
      handleSelectCharacter,
      {
        view: (targetId: string) => `选择角色 ${targetId}`,
        edit: (targetId: string) => `与 ${targetId} 互有克制的关系`,
      },
      createRelationOptions('counterEachOther')
    )
  );

  const counteredByItems = sortByImportance([
    ...buildCharacterItems(
      char.counteredBy,
      getImageUrl,
      handleSelectCharacter,
      {
        view: (targetId: string) => `选择角色 ${targetId}`,
        edit: (targetId: string) => `被 ${targetId} 克制的关系`,
      },
      createRelationOptions('counteredBy')
    ),
    ...buildKnowledgeCardItems(
      char.counteredByKnowledgeCards,
      (cardId: string) => navigate(`/cards/${encodeURIComponent(cardId)}`),
      createRelationOptions('counteredByKnowledgeCards')
    ),
    ...buildSpecialSkillItems(
      char.counteredBySpecialSkills,
      (skillId: string) =>
        navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
      oppositeFactionId,
      specialSkillsSnapshot as unknown as Record<FactionId, Record<string, { imageUrl?: string }>>,
      createRelationOptions('counteredBySpecialSkills')
    ),
  ]);

  const collaboratorItems = sortByImportance(
    buildCharacterItems(
      char.collaborators,
      (targetId: string) => AssetManager.getCharacterImageUrl(targetId, 'mouse'),
      handleSelectCharacter,
      {
        view: (targetId: string) => `选择角色 ${targetId}`,
        edit: (targetId: string) => `与 ${targetId} 的协作关系`,
      },
      createRelationOptions('collaborators')
    )
  );

  const advantageMapsItems = sortByImportance(
    buildMapItems(
      char.advantageMaps,
      (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
      mapsSnapshot as unknown as Record<string, { imageUrl?: string }>,
      createRelationOptions('advantageMaps')
    )
  );

  const advantageModesItems = sortByImportance(
    buildModeItems(
      char.advantageModes,
      (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
      modesSnapshot as unknown as Record<string, { imageUrl?: string }>,
      createRelationOptions('advantageModes')
    )
  );

  const disadvantageMapsItems = sortByImportance(
    buildMapItems(
      char.disadvantageMaps,
      (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
      mapsSnapshot as unknown as Record<string, { imageUrl?: string }>,
      createRelationOptions('disadvantageMaps')
    )
  );

  const disadvantageModesItems = sortByImportance(
    buildModeItems(
      char.disadvantageModes,
      (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
      modesSnapshot as unknown as Record<string, { imageUrl?: string }>,
      createRelationOptions('disadvantageModes')
    )
  );

  const advantageItems = sortByImportance([...advantageMapsItems, ...advantageModesItems]);

  const disadvantageItems = sortByImportance([...disadvantageMapsItems, ...disadvantageModesItems]);

  const sectionConfigs: CharacterRelationPanelSection[] = [
    {
      key: 'counters',
      theme: 'blue',
      title: `被${id}克制的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: <HappyFaceIcon aria-hidden='true' />,
      items: countersItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加角色'>
            <CharacterSelector
              currentCharacterId={id}
              factionId={factionId}
              relationType='counters'
              existingRelations={char.counters}
              onSelect={(characterId: string) =>
                addCharacterRelationItem(id, 'counters', createCharacterRelationItem(characterId))
              }
            />
          </div>
          <div title='添加知识卡'>
            <KnowledgeCardSelector
              selected={char.countersKnowledgeCards}
              onSelect={(cardId) =>
                addCharacterRelationItem(
                  id,
                  'countersKnowledgeCards',
                  createCharacterRelationItem(cardId)
                )
              }
              factionId={oppositeFactionId}
            />
          </div>
          <div title='添加特技'>
            <SpecialSkillSelector
              selected={char.countersSpecialSkills}
              factionId={factionId}
              onSelect={(skillId) =>
                addCharacterRelationItem(
                  id,
                  'countersSpecialSkills',
                  createCharacterRelationItem(skillId)
                )
              }
            />
          </div>
        </div>
      ),
      show: true,
      showEditControls: true,
    },
    {
      key: 'counterEachOther',
      theme: 'amber',
      title: `与${id}互有克制的${factionId == 'cat' ? '老鼠' : '猫咪'}`,
      icon: <NeutralFaceIcon aria-hidden='true' />,
      items: counterEachOtherItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加角色'>
            <CharacterSelector
              currentCharacterId={id}
              factionId={factionId}
              relationType='counterEachOther'
              existingRelations={char.counterEachOther}
              onSelect={(characterId: string) =>
                addCharacterRelationItem(
                  id,
                  'counterEachOther',
                  createCharacterRelationItem(characterId)
                )
              }
            />
          </div>
        </div>
      ),
      show: isEditMode || counterEachOtherItems.length > 0,
      showEditControls: true,
    },
    {
      key: 'counteredBy',
      theme: 'red',
      title: `克制${id}的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: <SadFaceIcon aria-hidden='true' />,
      items: counteredByItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加角色'>
            <CharacterSelector
              currentCharacterId={id}
              factionId={factionId}
              relationType='counteredBy'
              existingRelations={char.counteredBy}
              onSelect={(characterId: string) =>
                addCharacterRelationItem(
                  id,
                  'counteredBy',
                  createCharacterRelationItem(characterId)
                )
              }
            />
          </div>
          <div title='添加知识卡'>
            <KnowledgeCardSelector
              selected={char.counteredByKnowledgeCards}
              onSelect={(cardId) =>
                addCharacterRelationItem(
                  id,
                  'counteredByKnowledgeCards',
                  createCharacterRelationItem(cardId)
                )
              }
              factionId={oppositeFactionId}
            />
          </div>
          <div title='添加特技'>
            <SpecialSkillSelector
              selected={char.counteredBySpecialSkills}
              factionId={factionId}
              onSelect={(skillId) =>
                addCharacterRelationItem(
                  id,
                  'counteredBySpecialSkills',
                  createCharacterRelationItem(skillId)
                )
              }
            />
          </div>
        </div>
      ),
      show: true,
      showEditControls: true,
    },
    {
      key: 'collaborators',
      theme: 'green',
      title: `与${id}协作的老鼠`,
      icon: <HeartIcon aria-hidden='true' />,
      items: collaboratorItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加角色'>
            <CharacterSelector
              currentCharacterId={id}
              factionId={factionId}
              relationType='collaborators'
              existingRelations={char.collaborators}
              onSelect={(characterId: string) =>
                addCharacterRelationItem(
                  id,
                  'collaborators',
                  createCharacterRelationItem(characterId)
                )
              }
            />
          </div>
        </div>
      ),
      show: factionId === 'mouse',
      showEditControls: true,
    },
    {
      key: 'advantage',
      theme: 'orange',
      title: `${id}的优势地图/模式`,
      icon: (
        <div className='flex items-center justify-center'>
          <AdvantageIcon size={12} aria-hidden='true' />
          <MapIcon size={12} aria-hidden='true' />
        </div>
      ),
      items: advantageItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加地图'>
            <MapSelector
              selected={char.advantageMaps}
              onSelect={(mapId) =>
                addCharacterRelationItem(id, 'advantageMaps', createCharacterRelationItem(mapId))
              }
            />
          </div>
          <div title='添加模式'>
            <ModeSelector
              selected={char.advantageModes}
              onSelect={(modeId) =>
                addCharacterRelationItem(id, 'advantageModes', createCharacterRelationItem(modeId))
              }
            />
          </div>
        </div>
      ),
      show: isEditMode || advantageItems.length > 0,
      showEditControls: true,
    },
    {
      key: 'disadvantage',
      theme: 'purple',
      title: `${id}的劣势地图/模式`,
      icon: (
        <div className='flex items-center justify-center'>
          <DisadvantageIcon size={12} aria-hidden='true' />
          <MapIcon size={12} aria-hidden='true' />
        </div>
      ),
      items: disadvantageItems,
      selectors: (
        <div className='flex items-center gap-2'>
          <div title='添加地图'>
            <MapSelector
              selected={char.disadvantageMaps}
              onSelect={(mapId) =>
                addCharacterRelationItem(id, 'disadvantageMaps', createCharacterRelationItem(mapId))
              }
            />
          </div>
          <div title='添加模式'>
            <ModeSelector
              selected={char.disadvantageModes}
              onSelect={(modeId) =>
                addCharacterRelationItem(
                  id,
                  'disadvantageModes',
                  createCharacterRelationItem(modeId)
                )
              }
            />
          </div>
        </div>
      ),
      show: isEditMode || disadvantageItems.length > 0,
      showEditControls: true,
    },
  ];

  return <CharacterRelationPanel sections={sectionConfigs} isEditMode={isEditMode} />;
};

export default CharacterRelationDisplay;
