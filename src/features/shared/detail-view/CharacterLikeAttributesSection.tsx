import type { ReactNode } from 'react';

import { getTooltipContent } from '@/lib/tooltipUtils';
import type { FactionId, ItemAttributesAsCharacter } from '@/data/types';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import Tooltip from '@/components/ui/Tooltip';

import AttributeSection from './AttributeSection';

type CharacterLikeAttributeField =
  | 'maxHp'
  | 'hpRecovery'
  | 'moveSpeed'
  | 'jumpHeight'
  | 'attackBoost'
  | 'clawKnifeCdHit'
  | 'clawKnifeCdUnhit'
  | 'clawKnifeRange';

type CharacterLikeAttributeRow = {
  field: CharacterLikeAttributeField;
  title: string;
  value: number | string;
};

type CharacterLikeAttributesSectionProps = {
  attributes: ItemAttributesAsCharacter | undefined;
  intro: string;
  isDetailed: boolean;
  isEditMode?: boolean;
  onChange?: ((attributes: ItemAttributesAsCharacter | undefined) => void) | undefined;
  renderValue?:
    ((field: CharacterLikeAttributeField, value: number | string) => ReactNode) | undefined;
};

const ATTRIBUTE_ROWS = [
  { field: 'maxHp', title: 'Hp上限' },
  { field: 'hpRecovery', title: 'Hp恢复' },
  { field: 'moveSpeed', title: '移速' },
  { field: 'jumpHeight', title: '跳跃' },
  { field: 'attackBoost', title: '攻击增伤' },
  { field: 'clawKnifeCdHit', title: '攻击CD' },
  { field: 'clawKnifeCdUnhit', title: '未命中CD' },
  { field: 'clawKnifeRange', title: '攻击范围' },
] as const satisfies readonly {
  field: CharacterLikeAttributeField;
  title: string;
}[];

const renderFactionBelong = (factionBelong: ItemAttributesAsCharacter['factionBelong']) => {
  if (factionBelong === 'cat') {
    return <span className='text-sky-600 dark:text-sky-400'>猫阵营</span>;
  }

  if (factionBelong === 'mouse') {
    return <span className='text-amber-700 dark:text-amber-600'>鼠阵营</span>;
  }

  return <span className='text-fuchsia-600 dark:text-fuchsia-400'>第三阵营</span>;
};

const renderCharacterType = (type: ItemAttributesAsCharacter['type']) => {
  if (type === 'cat') {
    return <span className='text-sky-600 dark:text-sky-400'>猫角色</span>;
  }

  if (type === 'mouse') {
    return <span className='text-amber-700 dark:text-amber-600'>鼠角色</span>;
  }

  return <span className='text-fuchsia-600 dark:text-fuchsia-400'>特殊角色</span>;
};

export default function CharacterLikeAttributesSection({
  attributes,
  intro,
  isDetailed,
  isEditMode = false,
  onChange,
  renderValue,
}: CharacterLikeAttributesSectionProps) {
  if (attributes === undefined && !isEditMode) return null;

  const updateAttributes = (update: (next: ItemAttributesAsCharacter) => void) => {
    if (!onChange) return;
    const next: ItemAttributesAsCharacter = attributes
      ? { ...attributes }
      : { type: 'special', factionBelong: 'other' };
    update(next);
    onChange(next);
  };

  const updateOptionalAttribute = (field: CharacterLikeAttributeField, rawValue: string) => {
    updateAttributes((next) => {
      const mutable = next as ItemAttributesAsCharacter & Record<string, unknown>;
      const trimmed = rawValue.trim();
      if (trimmed === '') {
        delete mutable[field];
        return;
      }

      const value = Number(trimmed);
      if (!Number.isNaN(value)) {
        mutable[field] = value;
      }
    });
  };

  if (isEditMode) {
    return (
      <AttributeSection title='角色类属性'>
        <label className='mt-1 flex cursor-pointer items-center gap-1 text-xs'>
          <input
            type='checkbox'
            checked={attributes !== undefined}
            onChange={(event) => {
              if (!onChange) return;
              onChange(
                event.target.checked ? { type: 'special', factionBelong: 'other' } : undefined
              );
            }}
            className='h-3 w-3'
          />
          <span className='font-bold'>启用角色类属性</span>
        </label>
        {attributes ? (
          <div className='mt-2 space-y-2'>
            <div className='grid gap-2 sm:grid-cols-2'>
              <label className='text-xs'>
                角色类型
                <FormSelect
                  size='sm'
                  className='mt-1'
                  value={attributes.type}
                  onChange={(event) =>
                    updateAttributes((next) => {
                      next.type = event.target.value as ItemAttributesAsCharacter['type'];
                    })
                  }
                >
                  <option value='cat'>猫角色</option>
                  <option value='mouse'>鼠角色</option>
                  <option value='special'>特殊角色</option>
                </FormSelect>
              </label>
              <label className='text-xs'>
                阵营归属
                <FormSelect
                  size='sm'
                  className='mt-1'
                  value={attributes.factionBelong}
                  onChange={(event) =>
                    updateAttributes((next) => {
                      next.factionBelong = event.target
                        .value as ItemAttributesAsCharacter['factionBelong'];
                    })
                  }
                >
                  <option value='cat'>猫阵营</option>
                  <option value='mouse'>鼠阵营</option>
                  <option value='other'>第三阵营</option>
                </FormSelect>
              </label>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              {ATTRIBUTE_ROWS.map(({ field, title }) => (
                <label className='text-xs' key={field}>
                  <Tooltip
                    content={getTooltipContent(
                      title,
                      attributes.type === 'cat' ? 'cat' : 'mouse',
                      isDetailed
                    )}
                  >
                    {title}
                  </Tooltip>
                  <FormInput
                    size='sm'
                    className='mt-1'
                    type='number'
                    step='any'
                    disabled={field === 'maxHp' && attributes.maxHp === '一击即溃'}
                    value={
                      field === 'maxHp' && attributes.maxHp === '一击即溃'
                        ? ''
                        : (attributes[field] ?? '')
                    }
                    placeholder='未设置'
                    onChange={(event) => updateOptionalAttribute(field, event.target.value)}
                  />
                  {field === 'maxHp' ? (
                    <label className='mt-1 flex cursor-pointer items-center gap-1'>
                      <input
                        type='checkbox'
                        checked={attributes.maxHp === '一击即溃'}
                        onChange={(event) =>
                          updateAttributes((next) => {
                            if (event.target.checked) next.maxHp = '一击即溃';
                            else delete next.maxHp;
                          })
                        }
                        className='h-3 w-3'
                      />
                      <span>一击即溃</span>
                    </label>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </AttributeSection>
    );
  }

  const rows: CharacterLikeAttributeRow[] = ATTRIBUTE_ROWS.flatMap(({ field, title }) => {
    const value = attributes?.[field];
    return value === undefined ? [] : [{ field, title, value }];
  });
  const tooltipFaction: FactionId = attributes?.type === 'cat' ? 'cat' : 'mouse';

  if (!attributes) return null;

  return (
    <AttributeSection>
      <span className='text-sm font-bold'>
        {intro}
        <span className='text-fuchsia-600 dark:text-fuchsia-400'>角色</span>
        类似，可看作
        {renderFactionBelong(attributes.factionBelong)}的{renderCharacterType(attributes.type)}
      </span>
      <div className='auto-fill-grid grid-container grid grid-cols-[repeat(2,minmax(80px,1fr))] items-center justify-center gap-1 text-sm font-normal'>
        {rows.map(({ field, title, value }) => (
          <span className='text-sm whitespace-pre' key={field}>
            <Tooltip content={getTooltipContent(title, tooltipFaction, isDetailed)}>
              {title}
            </Tooltip>
            ：
            <span className='text-indigo-700 dark:text-indigo-400'>
              {renderValue ? renderValue(field, value) : value}
            </span>
          </span>
        ))}
      </div>
    </AttributeSection>
  );
}

export type { CharacterLikeAttributeField };
