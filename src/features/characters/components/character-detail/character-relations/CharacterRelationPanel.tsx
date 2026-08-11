import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/design';
import { supportsCharacterRelationTags } from '@/features/characters/utils/characterRelationTags';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import Button from '@/components/ui/Button';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import type { RelationDisplayItem } from './characterRelationViewModel';

type RelationTheme = 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'orange';

type RelationThemeClasses = {
  headerText: string;
  iconBg: string;
  itemBg: string;
  interactive: string;
  toggle: string;
};

export type CharacterRelationPanelSection = {
  key: string;
  theme: RelationTheme;
  title: string;
  icon: React.ReactNode;
  items: RelationDisplayItem[];
  selectors?: React.ReactNode;
  show?: boolean;
  showEditControls?: boolean;
};

type CharacterRelationPanelProps = {
  sections: CharacterRelationPanelSection[];
  isEditMode: boolean;
};

type RelationSectionProps = Omit<CharacterRelationPanelSection, 'key' | 'show'> & {
  isEditMode: boolean;
  canEditDescription?: boolean;
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
  'bg-surface/60 mt-1 w-full resize-none rounded-md border border-gray-200 px-2 py-1 text-left text-xs text-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 focus:outline-none dark:border-gray-600 dark:text-gray-300';
const minorLabelClassName = 'text-[11px] text-gray-500 dark:text-gray-400';
const relationTagClassName =
  'bg-surface/80 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-600 ring-1 ring-gray-200 dark:text-gray-300 dark:ring-slate-600';

const getItemAriaLabel = (item: RelationDisplayItem, canEdit: boolean) =>
  item.type === 'character' ? item.getAriaLabel(canEdit) : item.ariaLabel;

function RelationItemMedia({ item }: { item: RelationDisplayItem }) {
  if (item.type === 'character') {
    return (
      <Image
        src={item.imageSrc}
        alt={item.id}
        width={60}
        height={60}
        className='h-10 w-10 object-contain'
      />
    );
  }

  if (item.type === 'knowledgeCard') {
    return (
      <Image src={item.imageUrl} alt={item.id} width={32} height={40} className='mx-1 h-10 w-8' />
    );
  }

  if (item.type === 'specialSkill') {
    return item.imageUrl ? (
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
    );
  }

  if (item.type === 'map') {
    return item.imageUrl ? (
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
    );
  }

  return item.imageUrl ? (
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
  );
}

function RelationTagEditor({ item }: { item: RelationDisplayItem }) {
  const [tagPairs, setTagPairs] = useState(item.tagPairs);

  useEffect(() => {
    setTagPairs(item.tagPairs);
  }, [item.id, item.relationKind, item.tagPairs]);

  const updateTag = (index: number, field: 'counters' | 'counteredBy', value: string) => {
    setTagPairs((current) =>
      current.map((tag, tagIndex) => (tagIndex === index ? { ...tag, [field]: value } : tag))
    );
  };

  const saveTags = () => {
    const completeTags = tagPairs
      .map((tag) => ({
        counters: tag.counters.trim(),
        counteredBy: tag.counteredBy.trim(),
      }))
      .filter((tag) => tag.counters && tag.counteredBy);

    if (completeTags.length === tagPairs.length) {
      item.onUpdateTags?.(completeTags);
    }
  };

  return (
    <div className='mt-2 flex flex-col gap-1.5' onBlur={saveTags}>
      {tagPairs.map((tag, index) => (
        <div key={index} className='grid grid-cols-[1fr_1fr_auto] items-center gap-1.5'>
          <input
            value={tag.counters}
            onChange={(event) => updateTag(index, 'counters', event.currentTarget.value)}
            className={relationItemTextareaClassName}
            aria-label={`克制方分类 ${index + 1}`}
            placeholder='克制方，如：高伤'
          />
          <input
            value={tag.counteredBy}
            onChange={(event) => updateTag(index, 'counteredBy', event.currentTarget.value)}
            className={relationItemTextareaClassName}
            aria-label={`被克制方分类 ${index + 1}`}
            placeholder='被克制方，如：怕高伤'
          />
          <IconButton
            type='button'
            aria-label={`删除分类 ${index + 1}`}
            onClick={() => {
              const nextTags = tagPairs.filter((_, tagIndex) => tagIndex !== index);
              setTagPairs(nextTags);
              item.onUpdateTags?.(nextTags);
            }}
            variant='delete'
            size='sm'
          >
            <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
          </IconButton>
        </div>
      ))}
      <Button
        variant='unstyled'
        type='button'
        onClick={() => setTagPairs((current) => [...current, { counters: '', counteredBy: '' }])}
        className='inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40'
      >
        <PlusIcon className='h-3.5 w-3.5' aria-hidden='true' />
        添加克制分类
      </Button>
    </div>
  );
}

function RelationItemCard({
  item,
  themeClasses,
  canEdit,
  canEditDescription,
}: {
  item: RelationDisplayItem;
  themeClasses: RelationThemeClasses;
  canEdit: boolean;
  canEditDescription: boolean;
}) {
  const handleClick = () => {
    if (!canEdit) {
      item.onNavigate();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-row items-center gap-3 rounded-lg p-2',
        themeClasses.itemBg,
        !canEdit && themeClasses.interactive,
        item.isMinor && 'opacity-60'
      )}
      role={!canEdit ? 'button' : undefined}
      tabIndex={!canEdit ? 0 : undefined}
      aria-label={getItemAriaLabel(item, canEdit)}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (!canEdit && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          item.onNavigate();
        }
      }}
    >
      <RelationItemMedia item={item} />
      <div className='flex flex-1 flex-col'>
        <div className='flex items-center gap-1'>
          <span className={relationItemNameClassName}>{item.id}</span>
          {canEdit && item.isEditable && item.onToggleMinor ? (
            <Button
              variant='unstyled'
              type='button'
              onClick={() => item.onToggleMinor?.()}
              className={themeClasses.toggle}
              aria-label={item.getToggleLabel?.(!!item.isMinor) ?? '切换关系'}
            >
              {item.isMinor ? '次要' : '主要'}
            </Button>
          ) : (
            item.isMinor && <span className={minorLabelClassName}>(次要)</span>
          )}
          {canEdit && item.onRemove && (
            <IconButton
              type='button'
              aria-label='移除关系'
              onClick={() => item.onRemove?.()}
              variant='delete'
              size='sm'
              className='ml-auto'
            >
              <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
            </IconButton>
          )}
        </div>
        {!canEdit && item.tagLabels.length > 0 && (
          <div className='mt-1 flex flex-wrap gap-1' aria-label='克制分类'>
            {item.tagLabels.map((tag) => (
              <span key={tag} className={relationTagClassName}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {canEdit &&
          item.isEditable &&
          item.onUpdateTags &&
          supportsCharacterRelationTags(item.relationKind) && <RelationTagEditor item={item} />}
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
            <span className={relationItemDescriptionClassName}>
              <TextWithHoverTooltips text={item.description} />
            </span>
          )
        )}
      </div>
    </div>
  );
}

function RelationSection({
  title,
  icon,
  theme,
  items,
  selectors,
  isEditMode,
  showEditControls = false,
  canEditDescription = true,
}: RelationSectionProps) {
  const themeClasses = relationThemeClasses[theme];
  const canEdit = isEditMode && showEditControls;
  if (!canEdit && items.length === 0) return null;

  return (
    <div>
      <div className='flex items-center justify-between'>
        <span
          className={cn('flex items-center gap-1 text-base font-semibold', themeClasses.headerText)}
        >
          <span
            className={cn(
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
        {items.map((item) => (
          <RelationItemCard
            key={item.key}
            item={item}
            themeClasses={themeClasses}
            canEdit={canEdit}
            canEditDescription={canEditDescription}
          />
        ))}
      </div>
    </div>
  );
}

export default function CharacterRelationPanel({
  sections,
  isEditMode,
}: CharacterRelationPanelProps) {
  const visibleSections = sections.filter((section) => section.show !== false);

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
}
