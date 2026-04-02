'use client';

import React from 'react';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import { AssetManager } from '@/lib/assetManager';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterRelationItem, type FactionId, type TraitRelationKind } from '@/data/types';
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
import { editable } from '@/components/ui/editable';
import { TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { cards, characters, mapsEdit, modesEdit, specialSkillsEdit } from '@/data';

import {
  AdvantageIcon,
  DisadvantageIcon,
  HappyFaceIcon,
  HeartIcon,
  MapIcon,
  NeutralFaceIcon,
  SadFaceIcon,
} from './CharacterRelationIcons';
import KnowledgeCardSelector from './KnowledgeCardSelector';
import MapSelector from './MapSelector';
import ModeSelector from './ModeSelector';
import SpecialSkillSelector from './SpecialSkillSelector';

type Props = {
  id: string;
  factionId: FactionId;
};

type RelationTheme = 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'orange';

type RelationThemeClasses = {
  headerText: string;
  iconBg: string;
  itemBg: string;
  interactive: string;
  toggle: string;
};

const e = editable('characters');

const relationThemeClasses: Record<RelationTheme, RelationThemeClasses> = {
  blue: {
    headerText: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-200',
    itemBg: 'bg-blue-50 dark:bg-blue-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer',
  },
  amber: {
    headerText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-200',
    itemBg: 'bg-amber-50 dark:bg-amber-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-300 dark:hover:bg-amber-600 cursor-pointer',
  },
  red: {
    headerText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-200',
    itemBg: 'bg-red-50 dark:bg-red-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer',
  },
  green: {
    headerText: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-200',
    itemBg: 'bg-green-50 dark:bg-green-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full hover:bg-green-300 dark:hover:bg-green-600 cursor-pointer',
  },
  purple: {
    headerText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-200',
    itemBg: 'bg-purple-50 dark:bg-purple-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-purple-100 dark:hover:bg-purple-800/40 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-300 dark:hover:bg-purple-600 cursor-pointer',
  },
  orange: {
    headerText: 'text-orange-700 dark:text-orange-300',
    iconBg: 'bg-orange-200',
    itemBg: 'bg-orange-50 dark:bg-orange-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-orange-100 dark:hover:bg-orange-800/40 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-orange-200 rounded-full hover:bg-orange-300 dark:hover:bg-orange-600 cursor-pointer',
  },
};

const relationItemNameClassName = 'text-sm text-gray-700 dark:text-gray-300';
const relationItemDescriptionClassName = 'mt-1 text-left text-xs text-gray-500 dark:text-gray-400';
const relationItemTextareaClassName =
  'mt-1 w-full resize-none rounded-md border border-gray-200 bg-white/60 px-2 py-1 text-left text-xs text-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 focus:outline-none dark:border-gray-600 dark:bg-slate-800/60 dark:text-gray-300';
const minorLabelClassName = 'text-[11px] text-gray-500 dark:text-gray-400';

type RelationDisplayBase = {
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  isEditable: boolean;
  descriptionPath?: string;
  relationKind: TraitRelationKind;
  onToggleMinor?: () => void;
  getToggleLabel?: (currentIsMinor: boolean) => string;
  onRemove?: () => void;
  onUpdateDescription?: (description: string) => void;
};

type CharacterDisplayItem = RelationDisplayBase & {
  type: 'character';
  imageSrc: string;
  getAriaLabel: (isEditMode: boolean) => string;
  onNavigate: () => void;
};

type KnowledgeCardDisplayItem = RelationDisplayBase & {
  type: 'knowledgeCard';
  imageUrl: string;
  ariaLabel: string;
  onNavigate: () => void;
};

type SpecialSkillDisplayItem = RelationDisplayBase & {
  type: 'specialSkill';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

type MapDisplayItem = RelationDisplayBase & {
  type: 'map';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

type ModeDisplayItem = RelationDisplayBase & {
  type: 'mode';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

type RelationDisplayItem =
  | CharacterDisplayItem
  | KnowledgeCardDisplayItem
  | SpecialSkillDisplayItem
  | MapDisplayItem
  | ModeDisplayItem;

type RelationSectionConfig = {
  key: string;
  theme: RelationTheme;
  title: string;
  icon: React.ReactNode;
  items: RelationDisplayItem[];
  selectors?: React.ReactNode;
  show?: boolean;
  showEditControls?: boolean;
};

const toArray = <T,>(value: readonly T[] | undefined | null): T[] =>
  value ? Array.from(value) : [];

const sortByImportance = <T extends { isMinor?: boolean }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const aMinor = !!a.isMinor;
    const bMinor = !!b.isMinor;
    if (aMinor === bMinor) return 0;
    return aMinor ? 1 : -1;
  });

const buildCharacterItems = (
  combined: readonly CharacterRelationItem[],
  getImageUrl: (id: string) => string,
  handleSelectCharacter: (id: string) => void,
  ariaLabels: { view: (id: string) => string; edit: (id: string) => string },
  options: {
    relationKind: TraitRelationKind;
    isEditable: boolean;
    getDescriptionPath?: (index: number, id: string) => string | undefined;
    onToggleMinor?: (id: string) => void;
    onRemove?: (id: string) => void;
    onUpdateDescription?: (id: string, description: string) => void;
  }
): CharacterDisplayItem[] => {
  return combined.map((item, index) => {
    const id = item.id;
    const descriptionPath = options.getDescriptionPath?.(index, id);
    return {
      type: 'character',
      key: `character-${id}`,
      id,
      description: item.description ?? '',
      isMinor: !!item.isMinor,
      imageSrc: getImageUrl(id),
      getAriaLabel: (isEditMode) => (isEditMode ? ariaLabels.edit(id) : ariaLabels.view(id)),
      onNavigate: () => handleSelectCharacter(id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...(descriptionPath ? { descriptionPath } : {}),
      ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(id) } : {}),
      getToggleLabel: (currentIsMinor) => `切换${id}的关系为${currentIsMinor ? '主要' : '次要'}`,
      ...(options.onRemove ? { onRemove: () => options.onRemove?.(id) } : {}),
      ...(options.onUpdateDescription
        ? { onUpdateDescription: (description) => options.onUpdateDescription?.(id, description) }
        : {}),
    } satisfies CharacterDisplayItem;
  });
};

const buildKnowledgeCardItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToCard: (id: string) => void,
  options: {
    relationKind: TraitRelationKind;
    isEditable: boolean;
    getDescriptionPath?: (index: number, id: string) => string | undefined;
    onToggleMinor?: (id: string) => void;
    onRemove?: (id: string) => void;
    onUpdateDescription?: (id: string, description: string) => void;
  }
): KnowledgeCardDisplayItem[] =>
  toArray(items)
    .map((card, index) => {
      const cardObj = cards[card.id];
      if (!cardObj) return null;
      const descriptionPath = options.getDescriptionPath?.(index, card.id);
      return {
        type: 'knowledgeCard',
        key: `knowledgeCard-${card.id}`,
        id: card.id,
        description: card.description ?? '',
        isMinor: !!card.isMinor,
        imageUrl: cardObj.imageUrl,
        ariaLabel: `跳转到知识卡 ${card.id}`,
        onNavigate: () => navigateToCard(card.id),
        isEditable: options.isEditable,
        relationKind: options.relationKind,
        ...(descriptionPath ? { descriptionPath } : {}),
        ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(card.id) } : {}),
        getToggleLabel: (currentIsMinor) =>
          `切换${card.id}的知识卡关系为${currentIsMinor ? '主要' : '次要'}`,
        ...(options.onRemove ? { onRemove: () => options.onRemove?.(card.id) } : {}),
        ...(options.onUpdateDescription
          ? {
              onUpdateDescription: (description) =>
                options.onUpdateDescription?.(card.id, description),
            }
          : {}),
      } satisfies KnowledgeCardDisplayItem;
    })
    .filter(Boolean) as KnowledgeCardDisplayItem[];

const buildSpecialSkillItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToSkill: (id: string) => void,
  targetFaction: FactionId,
  specialSkillsData: Record<FactionId, Record<string, { imageUrl?: string }>>,
  options: {
    relationKind: TraitRelationKind;
    isEditable: boolean;
    getDescriptionPath?: (index: number, id: string) => string | undefined;
    onToggleMinor?: (id: string) => void;
    onRemove?: (id: string) => void;
    onUpdateDescription?: (id: string, description: string) => void;
  }
): SpecialSkillDisplayItem[] =>
  toArray(items).map((skill, index) => {
    const skillObj = specialSkillsData[targetFaction]?.[skill.id];
    const descriptionPath = options.getDescriptionPath?.(index, skill.id);
    return {
      type: 'specialSkill',
      key: `specialSkill-${skill.id}`,
      id: skill.id,
      description: skill.description ?? '',
      isMinor: !!skill.isMinor,
      ...(skillObj?.imageUrl ? { imageUrl: skillObj.imageUrl } : {}),
      ariaLabel: `跳转到特技 ${skill.id}`,
      onNavigate: () => navigateToSkill(skill.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...(descriptionPath ? { descriptionPath } : {}),
      ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(skill.id) } : {}),
      getToggleLabel: (currentIsMinor) =>
        `切换${skill.id}的特技关系为${currentIsMinor ? '主要' : '次要'}`,
      ...(options.onRemove ? { onRemove: () => options.onRemove?.(skill.id) } : {}),
      ...(options.onUpdateDescription
        ? {
            onUpdateDescription: (description) =>
              options.onUpdateDescription?.(skill.id, description),
          }
        : {}),
    } satisfies SpecialSkillDisplayItem;
  });

const buildMapItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMap: (id: string) => void,
  mapsData: Record<string, { imageUrl?: string }>,
  options: {
    relationKind: TraitRelationKind;
    isEditable: boolean;
    getDescriptionPath?: (index: number, id: string) => string | undefined;
    onToggleMinor?: (id: string) => void;
    onRemove?: (id: string) => void;
    onUpdateDescription?: (id: string, description: string) => void;
  }
): MapDisplayItem[] =>
  toArray(items).map((map, index) => {
    const mapObj = mapsData[map.id];
    const descriptionPath = options.getDescriptionPath?.(index, map.id);
    return {
      type: 'map',
      key: `map-${map.id}`,
      id: map.id,
      description: map.description ?? '',
      isMinor: !!map.isMinor,
      ...(mapObj?.imageUrl ? { imageUrl: mapObj.imageUrl } : {}),
      ariaLabel: `跳转到地图 ${map.id}`,
      onNavigate: () => navigateToMap(map.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...(descriptionPath ? { descriptionPath } : {}),
      ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(map.id) } : {}),
      getToggleLabel: (currentIsMinor) =>
        `切换${map.id}的地图关系为${currentIsMinor ? '主要' : '次要'}`,
      ...(options.onRemove ? { onRemove: () => options.onRemove?.(map.id) } : {}),
      ...(options.onUpdateDescription
        ? {
            onUpdateDescription: (description) =>
              options.onUpdateDescription?.(map.id, description),
          }
        : {}),
    } satisfies MapDisplayItem;
  });

const buildModeItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMode: (id: string) => void,
  modesData: Record<string, { imageUrl?: string }>,
  options: {
    relationKind: TraitRelationKind;
    isEditable: boolean;
    getDescriptionPath?: (index: number, id: string) => string | undefined;
    onToggleMinor?: (id: string) => void;
    onRemove?: (id: string) => void;
    onUpdateDescription?: (id: string, description: string) => void;
  }
): ModeDisplayItem[] =>
  toArray(items).map((mode, index) => {
    const modeObj = modesData[mode.id];
    const descriptionPath = options.getDescriptionPath?.(index, mode.id);
    return {
      type: 'mode',
      key: `mode-${mode.id}`,
      id: mode.id,
      description: mode.description ?? '',
      isMinor: !!mode.isMinor,
      ...(modeObj?.imageUrl ? { imageUrl: modeObj.imageUrl } : {}),
      ariaLabel: `跳转到模式 ${mode.id}`,
      onNavigate: () => navigateToMode(mode.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...(descriptionPath ? { descriptionPath } : {}),
      ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(mode.id) } : {}),
      getToggleLabel: (currentIsMinor) =>
        `切换${mode.id}的模式关系为${currentIsMinor ? '主要' : '次要'}`,
      ...(options.onRemove ? { onRemove: () => options.onRemove?.(mode.id) } : {}),
      ...(options.onUpdateDescription
        ? {
            onUpdateDescription: (description) =>
              options.onUpdateDescription?.(mode.id, description),
          }
        : {}),
    } satisfies ModeDisplayItem;
  });

type RelationSectionProps = {
  title: string;
  icon: React.ReactNode;
  theme: RelationTheme;
  items: RelationDisplayItem[];
  selectors?: React.ReactNode;
  isEditMode: boolean;
  showEditControls?: boolean;
  emptyLabel?: string;
  canEditDescription?: boolean;
};

const RelationSection: React.FC<RelationSectionProps> = ({
  title,
  icon,
  theme,
  items,
  selectors,
  isEditMode,
  showEditControls = false,
  emptyLabel = '无',
  canEditDescription = true,
}) => {
  const themeClasses = relationThemeClasses[theme];
  const canEdit = isEditMode && showEditControls;

  const renderCharacterItem = (item: CharacterDisplayItem) => {
    const ariaLabel = item.getAriaLabel(canEdit);
    const handleClick = () => {
      if (!canEdit) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 rounded-lg p-2',
          themeClasses.itemBg,
          !canEdit && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        {...(!canEdit && { role: 'button', tabIndex: 0 })}
        aria-label={ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        <Image
          src={item.imageSrc}
          alt={item.id}
          width={60}
          height={60}
          className='h-10 w-10 object-contain'
        />
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className={relationItemNameClassName}>{item.id}</span>
            {canEdit && item.isEditable && item.onToggleMinor ? (
              <button
                type='button'
                onClick={() => item.onToggleMinor?.()}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              !canEdit && item.isMinor && <span className={minorLabelClassName}>(次要)</span>
            )}
            {canEdit && item.onRemove && (
              <button
                type='button'
                aria-label='移除关系'
                onClick={() => item.onRemove?.()}
                className='ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' />
              </button>
            )}
          </div>
          {canEdit && canEditDescription ? (
            item.descriptionPath ? (
              <e.span
                path={`${item.descriptionPath}.description`}
                initialValue={item.description}
                className={relationItemDescriptionClassName}
                onSave={(value) => item.onUpdateDescription?.(value)}
              />
            ) : (
              <textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(event) => item.onUpdateDescription?.(event.currentTarget.value)}
                className={relationItemTextareaClassName}
                placeholder='补充关系描述'
              />
            )
          ) : (
            item.description && (
              <span className={relationItemDescriptionClassName}>{item.description}</span>
            )
          )}
        </div>
      </div>
    );
  };

  const renderKnowledgeCardItem = (item: KnowledgeCardDisplayItem) => {
    const handleClick = () => {
      if (!canEdit) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 rounded-lg p-2',
          themeClasses.itemBg,
          !canEdit && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!canEdit ? 'button' : undefined}
        tabIndex={!canEdit ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        <Image src={item.imageUrl} alt={item.id} width={32} height={40} className='mx-1 h-10 w-8' />
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className={relationItemNameClassName}>{item.id}</span>
            {canEdit && item.onToggleMinor ? (
              <button
                type='button'
                onClick={() => item.onToggleMinor?.()}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={minorLabelClassName}>(次要)</span>
            )}
            {canEdit && item.onRemove && (
              <button
                type='button'
                aria-label='移除关系'
                onClick={() => item.onRemove?.()}
                className='ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' />
              </button>
            )}
          </div>
          {canEdit && canEditDescription ? (
            item.descriptionPath ? (
              <e.span
                path={`${item.descriptionPath}.description`}
                initialValue={item.description}
                className={relationItemDescriptionClassName}
                onSave={(value) => item.onUpdateDescription?.(value)}
              />
            ) : (
              <textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(event) => item.onUpdateDescription?.(event.currentTarget.value)}
                className={relationItemTextareaClassName}
                placeholder='补充关系描述'
              />
            )
          ) : (
            item.description && (
              <span className={relationItemDescriptionClassName}>{item.description}</span>
            )
          )}
        </div>
      </div>
    );
  };

  const renderSpecialSkillItem = (item: SpecialSkillDisplayItem) => {
    const handleClick = () => {
      if (!canEdit) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 rounded-lg p-2',
          themeClasses.itemBg,
          !canEdit && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!canEdit ? 'button' : undefined}
        tabIndex={!canEdit ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.id}
            width={40}
            height={40}
            className='h-10 w-10 rounded-full object-cover'
          />
        ) : (
          <span className='flex h-10 w-10 items-center justify-center rounded-full bg-pink-200 text-xs text-pink-600'>
            ?
          </span>
        )}
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className={relationItemNameClassName}>{item.id}</span>
            {canEdit && item.onToggleMinor ? (
              <button
                type='button'
                onClick={() => item.onToggleMinor?.()}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={minorLabelClassName}>(次要)</span>
            )}
            {canEdit && item.onRemove && (
              <button
                type='button'
                aria-label='移除关系'
                onClick={() => item.onRemove?.()}
                className='ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' />
              </button>
            )}
          </div>
          {canEdit && canEditDescription ? (
            item.descriptionPath ? (
              <e.span
                path={`${item.descriptionPath}.description`}
                initialValue={item.description}
                className={relationItemDescriptionClassName}
                onSave={(value) => item.onUpdateDescription?.(value)}
              />
            ) : (
              <textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(event) => item.onUpdateDescription?.(event.currentTarget.value)}
                className={relationItemTextareaClassName}
                placeholder='补充关系描述'
              />
            )
          ) : (
            item.description && (
              <span className={relationItemDescriptionClassName}>{item.description}</span>
            )
          )}
        </div>
      </div>
    );
  };

  const renderMapItem = (item: MapDisplayItem) => {
    const handleClick = () => {
      if (!canEdit) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 rounded-lg p-2',
          themeClasses.itemBg,
          !canEdit && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!canEdit ? 'button' : undefined}
        tabIndex={!canEdit ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.id}
            width={40}
            height={40}
            className='h-10 w-10 rounded-lg object-cover'
          />
        ) : (
          <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200 text-xs text-blue-600'>
            地图
          </span>
        )}
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className={relationItemNameClassName}>{item.id}</span>
            {canEdit && item.onToggleMinor ? (
              <button
                type='button'
                onClick={() => item.onToggleMinor?.()}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={minorLabelClassName}>(次要)</span>
            )}
            {canEdit && item.onRemove && (
              <button
                type='button'
                aria-label='移除关系'
                onClick={() => item.onRemove?.()}
                className='ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' />
              </button>
            )}
          </div>
          {canEdit && canEditDescription ? (
            item.descriptionPath ? (
              <e.span
                path={`${item.descriptionPath}.description`}
                initialValue={item.description}
                className={relationItemDescriptionClassName}
                onSave={(value) => item.onUpdateDescription?.(value)}
              />
            ) : (
              <textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(event) => item.onUpdateDescription?.(event.currentTarget.value)}
                className={relationItemTextareaClassName}
                placeholder='补充关系描述'
              />
            )
          ) : (
            item.description && (
              <span className={relationItemDescriptionClassName}>{item.description}</span>
            )
          )}
        </div>
      </div>
    );
  };

  const renderModeItem = (item: ModeDisplayItem) => {
    const handleClick = () => {
      if (!canEdit) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 rounded-lg p-2',
          themeClasses.itemBg,
          !canEdit && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!canEdit ? 'button' : undefined}
        tabIndex={!canEdit ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!canEdit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.id}
            width={40}
            height={40}
            className='h-10 w-10 rounded-lg object-cover'
          />
        ) : (
          <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-xs text-purple-600'>
            模式
          </span>
        )}
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1'>
            <span className={relationItemNameClassName}>{item.id}</span>
            {canEdit && item.onToggleMinor ? (
              <button
                type='button'
                onClick={() => item.onToggleMinor?.()}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={minorLabelClassName}>(次要)</span>
            )}
            {canEdit && item.onRemove && (
              <button
                type='button'
                aria-label='移除关系'
                onClick={() => item.onRemove?.()}
                className='ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' />
              </button>
            )}
          </div>
          {canEdit && canEditDescription ? (
            item.descriptionPath ? (
              <e.span
                path={`${item.descriptionPath}.description`}
                initialValue={item.description}
                className={relationItemDescriptionClassName}
                onSave={(value) => item.onUpdateDescription?.(value)}
              />
            ) : (
              <textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(event) => item.onUpdateDescription?.(event.currentTarget.value)}
                className={relationItemTextareaClassName}
                placeholder='补充关系描述'
              />
            )
          ) : (
            item.description && (
              <span className={relationItemDescriptionClassName}>{item.description}</span>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <span
          className={clsx(
            'flex items-center gap-1 text-base font-semibold',
            themeClasses.headerText
          )}
        >
          <span
            className={clsx(
              'mr-1 flex h-5 w-5 items-center justify-center rounded-full',
              themeClasses.iconBg
            )}
          >
            {icon}
          </span>
          {title}
        </span>
        {canEdit && selectors}
      </div>
      <div className='mt-2 grid grid-cols-1 gap-y-3'>
        {!canEdit && items.length === 0 ? (
          <span className='text-xs text-gray-400'>{emptyLabel}</span>
        ) : (
          items.map((item) => {
            if (item.type === 'character') {
              return renderCharacterItem(item);
            }
            if (item.type === 'knowledgeCard') {
              return renderKnowledgeCardItem(item);
            }
            if (item.type === 'specialSkill') {
              return renderSpecialSkillItem(item);
            }
            if (item.type === 'map') {
              return renderMapItem(item);
            }
            if (item.type === 'mode') {
              return renderModeItem(item);
            }
            return null;
          })
        )}
      </div>
    </div>
  );
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

  const countersItems = sortByImportance([
    ...buildCharacterItems(
      char.counters,
      getImageUrl,
      handleSelectCharacter,
      {
        view: (targetId: string) => `选择角色 ${targetId}`,
        edit: (targetId: string) => `克制 ${targetId} 的关系`,
      },
      {
        relationKind: 'counters',
        isEditable: true,
        getDescriptionPath: (index) => getCharacterRelationDescriptionPath('counters', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'counters', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'counters', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'counters', itemId, description),
      }
    ),
    ...buildKnowledgeCardItems(
      char.countersKnowledgeCards,
      (cardId: string) => navigate(`/cards/${encodeURIComponent(cardId)}`),
      {
        relationKind: 'countersKnowledgeCards',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('countersKnowledgeCards', index),
        onToggleMinor: (itemId) =>
          toggleCharacterRelationMinor(id, 'countersKnowledgeCards', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'countersKnowledgeCards', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'countersKnowledgeCards', itemId, description),
      }
    ),
    ...buildSpecialSkillItems(
      char.countersSpecialSkills,
      (skillId: string) =>
        navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
      oppositeFactionId,
      specialSkillsSnapshot as unknown as Record<FactionId, Record<string, { imageUrl?: string }>>,
      {
        relationKind: 'countersSpecialSkills',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('countersSpecialSkills', index),
        onToggleMinor: (itemId) =>
          toggleCharacterRelationMinor(id, 'countersSpecialSkills', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'countersSpecialSkills', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'countersSpecialSkills', itemId, description),
      }
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
      {
        relationKind: 'counterEachOther',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('counterEachOther', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'counterEachOther', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'counterEachOther', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'counterEachOther', itemId, description),
      }
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
      {
        relationKind: 'counteredBy',
        isEditable: true,
        getDescriptionPath: (index) => getCharacterRelationDescriptionPath('counteredBy', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'counteredBy', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'counteredBy', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'counteredBy', itemId, description),
      }
    ),
    ...buildKnowledgeCardItems(
      char.counteredByKnowledgeCards,
      (cardId: string) => navigate(`/cards/${encodeURIComponent(cardId)}`),
      {
        relationKind: 'counteredByKnowledgeCards',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('counteredByKnowledgeCards', index),
        onToggleMinor: (itemId) =>
          toggleCharacterRelationMinor(id, 'counteredByKnowledgeCards', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'counteredByKnowledgeCards', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'counteredByKnowledgeCards', itemId, description),
      }
    ),
    ...buildSpecialSkillItems(
      char.counteredBySpecialSkills,
      (skillId: string) =>
        navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
      oppositeFactionId,
      specialSkillsSnapshot as unknown as Record<FactionId, Record<string, { imageUrl?: string }>>,
      {
        relationKind: 'counteredBySpecialSkills',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('counteredBySpecialSkills', index),
        onToggleMinor: (itemId) =>
          toggleCharacterRelationMinor(id, 'counteredBySpecialSkills', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'counteredBySpecialSkills', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'counteredBySpecialSkills', itemId, description),
      }
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
      {
        relationKind: 'collaborators',
        isEditable: true,
        getDescriptionPath: (index) => getCharacterRelationDescriptionPath('collaborators', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'collaborators', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'collaborators', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'collaborators', itemId, description),
      }
    )
  );

  const advantageMapsItems = sortByImportance(
    buildMapItems(
      char.advantageMaps,
      (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
      mapsSnapshot as unknown as Record<string, { imageUrl?: string }>,
      {
        relationKind: 'advantageMaps',
        isEditable: true,
        getDescriptionPath: (index) => getCharacterRelationDescriptionPath('advantageMaps', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'advantageMaps', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'advantageMaps', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'advantageMaps', itemId, description),
      }
    )
  );

  const advantageModesItems = sortByImportance(
    buildModeItems(
      char.advantageModes,
      (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
      modesSnapshot as unknown as Record<string, { imageUrl?: string }>,
      {
        relationKind: 'advantageModes',
        isEditable: true,
        getDescriptionPath: (index) => getCharacterRelationDescriptionPath('advantageModes', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'advantageModes', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'advantageModes', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'advantageModes', itemId, description),
      }
    )
  );

  const disadvantageMapsItems = sortByImportance(
    buildMapItems(
      char.disadvantageMaps,
      (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
      mapsSnapshot as unknown as Record<string, { imageUrl?: string }>,
      {
        relationKind: 'disadvantageMaps',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('disadvantageMaps', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'disadvantageMaps', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'disadvantageMaps', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'disadvantageMaps', itemId, description),
      }
    )
  );

  const disadvantageModesItems = sortByImportance(
    buildModeItems(
      char.disadvantageModes,
      (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
      modesSnapshot as unknown as Record<string, { imageUrl?: string }>,
      {
        relationKind: 'disadvantageModes',
        isEditable: true,
        getDescriptionPath: (index) =>
          getCharacterRelationDescriptionPath('disadvantageModes', index),
        onToggleMinor: (itemId) => toggleCharacterRelationMinor(id, 'disadvantageModes', itemId),
        onRemove: (itemId) => removeCharacterRelationItem(id, 'disadvantageModes', itemId),
        onUpdateDescription: (itemId, description) =>
          updateCharacterRelationDescription(id, 'disadvantageModes', itemId, description),
      }
    )
  );

  const advantageItems = sortByImportance([...advantageMapsItems, ...advantageModesItems]);

  const disadvantageItems = sortByImportance([...disadvantageMapsItems, ...disadvantageModesItems]);

  const sectionConfigs: RelationSectionConfig[] = [
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

  const visibleSections = sectionConfigs.filter((section) => section.show !== false);

  return (
    <div className='flex items-start gap-6 rounded-lg bg-gray-50 p-4 shadow dark:bg-slate-800/50'>
      <div className='flex flex-1 flex-col gap-4'>
        {visibleSections.map((section) => (
          <RelationSection
            key={section.key}
            title={section.title}
            icon={section.icon}
            theme={section.theme}
            items={section.items}
            selectors={section.selectors}
            isEditMode={isEditMode}
            showEditControls={section.showEditControls ?? false}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterRelationDisplay;
