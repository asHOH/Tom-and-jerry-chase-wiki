import React from 'react';

import { cn } from '@/lib/design';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { TrashIcon } from '@/components/icons/CommonIcons';
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
  emptyLabel?: string;
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
  'mt-1 w-full resize-none rounded-md border border-gray-200 bg-white/60 px-2 py-1 text-left text-xs text-gray-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 focus:outline-none dark:border-gray-600 dark:bg-slate-800/60 dark:text-gray-300';
const minorLabelClassName = 'text-[11px] text-gray-500 dark:text-gray-400';

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
  emptyLabel = '无',
  canEditDescription = true,
}: RelationSectionProps) {
  const themeClasses = relationThemeClasses[theme];
  const canEdit = isEditMode && showEditControls;

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
        {!canEdit && items.length === 0 ? (
          <span className='text-xs text-gray-400'>{emptyLabel}</span>
        ) : (
          items.map((item) => (
            <RelationItemCard
              key={item.key}
              item={item}
              themeClasses={themeClasses}
              canEdit={canEdit}
              canEditDescription={canEditDescription}
            />
          ))
        )}
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
