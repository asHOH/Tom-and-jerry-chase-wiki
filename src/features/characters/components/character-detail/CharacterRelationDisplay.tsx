'use client';

import React from 'react';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import { AssetManager } from '@/lib/assetManager';
import { useNavigation } from '@/hooks/useNavigation';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { CharacterRelationItem, type FactionId } from '@/data/types';
import { getCharacterRelation } from '@/features/characters/utils/relations';
import Image from '@/components/Image';
import { cards, mapsEdit, modesEdit, specialSkillsEdit } from '@/data';

import {
  AdvantageIcon,
  DisadvantageIcon,
  HappyFaceIcon,
  HeartIcon,
  MapIcon,
  NeutralFaceIcon,
  SadFaceIcon,
} from './CharacterRelationIcons';

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
  badge: string;
};

const relationThemeClasses: Record<RelationTheme, RelationThemeClasses> = {
  blue: {
    headerText: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-200',
    itemBg: 'bg-blue-50 dark:bg-blue-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full',
  },
  amber: {
    headerText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-200',
    itemBg: 'bg-amber-50 dark:bg-amber-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-300 dark:hover:bg-amber-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full',
  },
  red: {
    headerText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-200',
    itemBg: 'bg-red-50 dark:bg-red-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full',
  },
  green: {
    headerText: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-200',
    itemBg: 'bg-green-50 dark:bg-green-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full hover:bg-green-300 dark:hover:bg-green-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full',
  },
  purple: {
    headerText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-200',
    itemBg: 'bg-purple-50 dark:bg-purple-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-purple-100 dark:hover:bg-purple-800/40 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-300 dark:hover:bg-purple-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full',
  },
  orange: {
    headerText: 'text-orange-700 dark:text-orange-300',
    iconBg: 'bg-orange-200',
    itemBg: 'bg-orange-50 dark:bg-orange-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-orange-100 dark:hover:bg-orange-800/40 focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-orange-200 rounded-full hover:bg-orange-300 dark:hover:bg-orange-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-orange-200 rounded-full',
  },
};

type CharacterDisplayItem = {
  type: 'character';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageSrc: string;
  getAriaLabel: (isEditMode: boolean) => string;
  onNavigate: () => void;
  showEditable: boolean;
  onToggleMinor?: () => void;
  getToggleLabel?: (currentIsMinor: boolean) => string;
};

type KnowledgeCardDisplayItem = {
  type: 'knowledgeCard';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl: string;
  ariaLabel: string;
  onNavigate: () => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
};

type SpecialSkillDisplayItem = {
  type: 'specialSkill';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
};

type MapDisplayItem = {
  type: 'map';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
};

type ModeDisplayItem = {
  type: 'mode';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
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
  ariaLabels: { view: (id: string) => string; edit: (id: string) => string }
): CharacterDisplayItem[] => {
  return combined.map((item) => {
    const id = item.id;
    return {
      type: 'character',
      key: `character-${id}`,
      id,
      description: item.description ?? '',
      isMinor: !!item.isMinor,
      imageSrc: getImageUrl(id),
      getAriaLabel: (isEditMode) => (isEditMode ? ariaLabels.edit(id) : ariaLabels.view(id)),
      onNavigate: () => handleSelectCharacter(id),
      showEditable: false,
    } satisfies CharacterDisplayItem;
  });
};

const buildKnowledgeCardItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToCard: (id: string) => void
): KnowledgeCardDisplayItem[] =>
  toArray(items)
    .map((card) => {
      const cardObj = cards[card.id];
      if (!cardObj) return null;
      return {
        type: 'knowledgeCard',
        key: `knowledgeCard-${card.id}`,
        id: card.id,
        description: card.description ?? '',
        isMinor: !!card.isMinor,
        imageUrl: cardObj.imageUrl,
        ariaLabel: `跳转到知识卡 ${card.id}`,
        onNavigate: () => navigateToCard(card.id),
        onToggleMinor: () => {},
        getToggleLabel: (currentIsMinor) =>
          `切换${card.id}的知识卡关系为${currentIsMinor ? '主要' : '次要'}`,
      } satisfies KnowledgeCardDisplayItem;
    })
    .filter(Boolean) as KnowledgeCardDisplayItem[];

const buildSpecialSkillItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToSkill: (id: string) => void,
  targetFaction: FactionId,
  specialSkillsData: Record<FactionId, Record<string, { imageUrl?: string }>>
): SpecialSkillDisplayItem[] =>
  toArray(items).map((skill) => {
    const skillObj = specialSkillsData[targetFaction]?.[skill.id];
    return {
      type: 'specialSkill',
      key: `specialSkill-${skill.id}`,
      id: skill.id,
      description: skill.description ?? '',
      isMinor: !!skill.isMinor,
      ...(skillObj?.imageUrl ? { imageUrl: skillObj.imageUrl } : {}),
      ariaLabel: `跳转到特技 ${skill.id}`,
      onNavigate: () => navigateToSkill(skill.id),
      onToggleMinor: () => {},
      getToggleLabel: (currentIsMinor) =>
        `切换${skill.id}的特技关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies SpecialSkillDisplayItem;
  });

const buildMapItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMap: (id: string) => void,
  mapsData: Record<string, { imageUrl?: string }>
): MapDisplayItem[] =>
  toArray(items).map((map) => {
    const mapObj = mapsData[map.id];
    return {
      type: 'map',
      key: `map-${map.id}`,
      id: map.id,
      description: map.description ?? '',
      isMinor: !!map.isMinor,
      ...(mapObj?.imageUrl ? { imageUrl: mapObj.imageUrl } : {}),
      ariaLabel: `跳转到地图 ${map.id}`,
      onNavigate: () => navigateToMap(map.id),
      onToggleMinor: () => {},
      getToggleLabel: (currentIsMinor) =>
        `切换${map.id}的地图关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies MapDisplayItem;
  });

const buildModeItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMode: (id: string) => void,
  modesData: Record<string, { imageUrl?: string }>
): ModeDisplayItem[] =>
  toArray(items).map((mode) => {
    const modeObj = modesData[mode.id];
    return {
      type: 'mode',
      key: `mode-${mode.id}`,
      id: mode.id,
      description: mode.description ?? '',
      isMinor: !!mode.isMinor,
      ...(modeObj?.imageUrl ? { imageUrl: modeObj.imageUrl } : {}),
      ariaLabel: `跳转到模式 ${mode.id}`,
      onNavigate: () => navigateToMode(mode.id),
      onToggleMinor: () => {},
      getToggleLabel: (currentIsMinor) =>
        `切换${mode.id}的模式关系为${currentIsMinor ? '主要' : '次要'}`,
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {canEdit && item.showEditable ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              !canEdit && item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {!canEdit && item.description && (
            <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
              {item.description}
            </span>
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {canEdit ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {canEdit ? (
            <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
              {item.description}
            </span>
          ) : (
            item.description && (
              <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
                {item.description}
              </span>
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {canEdit ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {canEdit ? (
            <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
              {item.description}
            </span>
          ) : (
            item.description && (
              <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
                {item.description}
              </span>
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {canEdit ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {canEdit ? (
            <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
              {item.description}
            </span>
          ) : (
            item.description && (
              <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
                {item.description}
              </span>
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {canEdit ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {canEdit ? (
            <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
              {item.description}
            </span>
          ) : (
            item.description && (
              <span className='mt-1 text-left text-[11px] text-gray-500 dark:text-gray-400'>
                {item.description}
              </span>
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
          className={clsx('flex items-center gap-1 text-sm font-semibold', themeClasses.headerText)}
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
  const { isEditMode } = useEditMode();
  const mapsSnapshot = useSnapshot(mapsEdit);
  const modesSnapshot = useSnapshot(modesEdit);
  const specialSkillsSnapshot = useSnapshot(specialSkillsEdit);
  const getImageUrl = React.useCallback(
    (targetId: string) =>
      AssetManager.getCharacterImageUrl(targetId, factionId === 'cat' ? 'mouse' : 'cat'),
    [factionId]
  );
  const char = getCharacterRelation(id);
  const { handleSelectCharacter } = useAppContext();
  const { navigate } = useNavigation();

  const oppositeFactionId = factionId === 'cat' ? 'mouse' : 'cat';

  const countersItems = React.useMemo(
    () =>
      sortByImportance([
        ...buildCharacterItems(char.counters, getImageUrl, handleSelectCharacter, {
          view: (targetId: string) => `选择角色 ${targetId}`,
          edit: (targetId: string) => `克制 ${targetId} 的关系`,
        }),
        ...buildKnowledgeCardItems(char.countersKnowledgeCards, (cardId: string) =>
          navigate(`/cards/${encodeURIComponent(cardId)}`)
        ),
        ...buildSpecialSkillItems(
          char.countersSpecialSkills,
          (skillId: string) =>
            navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
          oppositeFactionId,
          specialSkillsSnapshot as unknown as Record<
            FactionId,
            Record<string, { imageUrl?: string }>
          >
        ),
      ]),
    [
      char.counters,
      char.countersKnowledgeCards,
      char.countersSpecialSkills,
      getImageUrl,
      handleSelectCharacter,
      specialSkillsSnapshot,
      navigate,
      oppositeFactionId,
    ]
  );

  const counterEachOtherItems = React.useMemo(
    () =>
      sortByImportance(
        buildCharacterItems(char.counterEachOther, getImageUrl, handleSelectCharacter, {
          view: (targetId: string) => `选择角色 ${targetId}`,
          edit: (targetId: string) => `与 ${targetId} 互有克制的关系`,
        })
      ),
    [char.counterEachOther, getImageUrl, handleSelectCharacter]
  );

  const counteredByItems = React.useMemo(
    () =>
      sortByImportance([
        ...buildCharacterItems(char.counteredBy, getImageUrl, handleSelectCharacter, {
          view: (targetId: string) => `选择角色 ${targetId}`,
          edit: (targetId: string) => `被 ${targetId} 克制的关系`,
        }),
        ...buildKnowledgeCardItems(char.counteredByKnowledgeCards, (cardId: string) =>
          navigate(`/cards/${encodeURIComponent(cardId)}`)
        ),
        ...buildSpecialSkillItems(
          char.counteredBySpecialSkills,
          (skillId: string) =>
            navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
          oppositeFactionId,
          specialSkillsSnapshot as unknown as Record<
            FactionId,
            Record<string, { imageUrl?: string }>
          >
        ),
      ]),
    [
      char.counteredBy,
      char.counteredByKnowledgeCards,
      char.counteredBySpecialSkills,
      getImageUrl,
      handleSelectCharacter,
      specialSkillsSnapshot,
      navigate,
      oppositeFactionId,
    ]
  );

  const collaboratorItems = React.useMemo(
    () =>
      sortByImportance(
        buildCharacterItems(
          char.collaborators,
          (targetId: string) => AssetManager.getCharacterImageUrl(targetId, 'mouse'),
          handleSelectCharacter,
          {
            view: (targetId: string) => `选择角色 ${targetId}`,
            edit: (targetId: string) => `与 ${targetId} 的协作关系`,
          }
        )
      ),
    [char.collaborators, handleSelectCharacter]
  );

  const advantageMapsItems = React.useMemo(
    () =>
      sortByImportance(
        buildMapItems(
          char.advantageMaps,
          (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
          mapsSnapshot as unknown as Record<string, { imageUrl?: string }>
        )
      ),
    [char.advantageMaps, mapsSnapshot, navigate]
  );

  const advantageModesItems = React.useMemo(
    () =>
      sortByImportance(
        buildModeItems(
          char.advantageModes,
          (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
          modesSnapshot as unknown as Record<string, { imageUrl?: string }>
        )
      ),
    [char.advantageModes, modesSnapshot, navigate]
  );

  const disadvantageMapsItems = React.useMemo(
    () =>
      sortByImportance(
        buildMapItems(
          char.disadvantageMaps,
          (mapId: string) => navigate(`/maps/${encodeURIComponent(mapId)}`),
          mapsSnapshot as unknown as Record<string, { imageUrl?: string }>
        )
      ),
    [char.disadvantageMaps, mapsSnapshot, navigate]
  );

  const disadvantageModesItems = React.useMemo(
    () =>
      sortByImportance(
        buildModeItems(
          char.disadvantageModes,
          (modeId: string) => navigate(`/modes/${encodeURIComponent(modeId)}`),
          modesSnapshot as unknown as Record<string, { imageUrl?: string }>
        )
      ),
    [char.disadvantageModes, modesSnapshot, navigate]
  );

  const advantageItems = React.useMemo(
    () => sortByImportance([...advantageMapsItems, ...advantageModesItems]),
    [advantageMapsItems, advantageModesItems]
  );

  const disadvantageItems = React.useMemo(
    () => sortByImportance([...disadvantageMapsItems, ...disadvantageModesItems]),
    [disadvantageMapsItems, disadvantageModesItems]
  );

  const sectionConfigs: RelationSectionConfig[] = React.useMemo(
    () => [
      {
        key: 'counters',
        theme: 'blue',
        title: `被${id}克制的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
        icon: <HappyFaceIcon aria-hidden='true' />,
        items: countersItems,
        selectors: undefined,
        show: true,
        showEditControls: false,
      },
      {
        key: 'counterEachOther',
        theme: 'amber',
        title: `与${id}互有克制的${factionId == 'cat' ? '老鼠' : '猫咪'}`,
        icon: <NeutralFaceIcon aria-hidden='true' />,
        items: counterEachOtherItems,
        selectors: undefined,
        show: counterEachOtherItems.length > 0,
        showEditControls: false,
      },
      {
        key: 'counteredBy',
        theme: 'red',
        title: `克制${id}的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
        icon: <SadFaceIcon aria-hidden='true' />,
        items: counteredByItems,
        selectors: undefined,
        show: true,
        showEditControls: false,
      },
      {
        key: 'collaborators',
        theme: 'green',
        title: `与${id}协作的老鼠`,
        icon: <HeartIcon aria-hidden='true' />,
        items: collaboratorItems,
        selectors: undefined,
        show: factionId === 'mouse',
        showEditControls: false,
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
        selectors: undefined,
        show: advantageItems.length > 0,
        showEditControls: false,
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
        selectors: undefined,
        show: disadvantageItems.length > 0,
        showEditControls: false,
      },
    ],
    [
      counterEachOtherItems,
      counteredByItems,
      countersItems,
      factionId,
      id,
      collaboratorItems,
      advantageItems,
      disadvantageItems,
    ]
  );

  const visibleSections = React.useMemo(
    () => sectionConfigs.filter((section) => section.show !== false),
    [sectionConfigs]
  );

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
