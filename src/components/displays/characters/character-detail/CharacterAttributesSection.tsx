import React from 'react';
import AttributeDisplay from './AttributeDisplay';
import { Character, FactionId } from '@/data/types';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';

interface CharacterAttribute {
  label: string;
  value: string | number;
  condition: boolean;
  className?: string;
  path?: string;
  suffix?: string;
}

interface CharacterAttributesSectionProps {
  character: Character;
  factionId: FactionId;
}

export default function CharacterAttributesSection({
  character,
  factionId,
}: CharacterAttributesSectionProps) {
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const commonAttributes: CharacterAttribute[] = [
    {
      label: 'Hp上限',
      value: character.maxHp || 0,
      condition: !!character.maxHp,
      path: `maxHp`,
    },
    {
      label: 'Hp恢复',
      value: character.hpRecovery || 0,
      condition: !!character.hpRecovery,
      path: `hpRecovery`,
      suffix: ' /s',
    },
    {
      label: '移速',
      value: character.moveSpeed || 0,
      condition: !!character.moveSpeed,
      path: `moveSpeed`,
    },
  ];

  const mouseAttributes: CharacterAttribute[] = [
    {
      label: '跳跃',
      value: character.jumpHeight || 0,
      condition: !!character.jumpHeight && factionId === 'mouse',
      path: `jumpHeight`,
    },
    {
      label: '攻击增伤',
      value: character.attackBoost || 0,
      condition:
        factionId === 'mouse' && character.attackBoost !== undefined && character.attackBoost !== 0,
      path: `attackBoost`,
    },
    {
      label: '推速',
      value: character.cheesePushSpeed || 0,
      condition: factionId === 'mouse' && !!character.cheesePushSpeed,
      path: `cheesePushSpeed`,
      suffix: '%/s',
    },
    {
      label: '墙缝增伤',
      value: character.wallCrackDamageBoost || 0,
      condition: factionId === 'mouse' && !!character.wallCrackDamageBoost,
      path: `wallCrackDamageBoost`,
    },
  ];

  const catAttributes: CharacterAttribute[] = [
    {
      label: '爪刀范围',
      value: character.clawKnifeRange || 0,
      condition: factionId === 'cat' && !!character.clawKnifeRange,
      path: `clawKnifeRange`,
    },
    {
      label: '爪刀CD',
      value: `${character.clawKnifeCdUnhit || 0} / ${character.clawKnifeCdHit || 0} 秒`,
      condition: factionId === 'cat' && !!character.clawKnifeCdHit && !!character.clawKnifeCdUnhit,
    },
  ];

  const allAttributes = [
    ...commonAttributes,
    ...(factionId === 'mouse' ? mouseAttributes : catAttributes),
  ];

  const visibleAttributes = allAttributes.filter((attr) => attr.condition);

  // Check if we should make 爪刀CD span both columns (cat with exactly 5 attributes)
  const shouldSpanClawKnifeCD =
    factionId === 'cat' &&
    visibleAttributes.length === 5 &&
    !((character.attackBoost !== undefined && character.attackBoost !== 0) || isEditMode);

  return (
    <div className='grid grid-cols-2 gap-3'>
      {visibleAttributes.map((attr, index) => {
        const isLastClawKnifeCD =
          shouldSpanClawKnifeCD &&
          index === visibleAttributes.length - 1 &&
          attr.label === '爪刀CD';

        return (
          <AttributeDisplay
            key={attr.label}
            label={attr.label}
            value={attr.value}
            factionId={factionId}
            isDetailed={isDetailed}
            path={attr.path ?? ''}
            suffix={attr.suffix ?? ''}
            {...(attr.className && { className: attr.className })}
            {...(isLastClawKnifeCD && {
              className: `${attr.className || 'text-sm text-gray-700 py-1'} col-span-2`,
            })}
          />
        );
      })}

      {factionId === 'cat' &&
        ((character.attackBoost !== undefined && character.attackBoost !== 0) || isEditMode) && (
          <AttributeDisplay
            label='攻击增伤'
            value={character.attackBoost ?? 0}
            factionId={factionId}
            isDetailed={isDetailed}
            path='attackBoost'
            className='text-sm text-amber-600 py-1'
          />
        )}
    </div>
  );
}
