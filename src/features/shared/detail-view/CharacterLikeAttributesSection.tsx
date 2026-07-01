import type { ReactNode } from 'react';

import { getTooltipContent } from '@/lib/tooltipUtils';
import type { FactionId, ItemAttributesAsCharacter } from '@/data/types';
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
  renderValue,
}: CharacterLikeAttributesSectionProps) {
  if (attributes === undefined) return null;

  const rows: CharacterLikeAttributeRow[] = ATTRIBUTE_ROWS.flatMap(({ field, title }) => {
    const value = attributes[field];
    return value === undefined ? [] : [{ field, title, value }];
  });
  const tooltipFaction: FactionId = attributes.type === 'cat' ? 'cat' : 'mouse';

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
