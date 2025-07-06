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
    // FIXME: should this really be hidden?
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

  return (
    <div className='grid grid-cols-2 gap-3'>
      {visibleAttributes.map((attr) => (
        <AttributeDisplay
          key={attr.label}
          label={attr.label}
          value={attr.value}
          factionId={factionId}
          isDetailed={isDetailed}
          path={attr.path ?? ''}
          suffix={attr.suffix ?? ''}
          {...(attr.className && { className: attr.className })}
        />
      ))}

      {factionId === 'cat' &&
        ((character.attackBoost !== undefined && character.attackBoost !== 0) || isEditMode) && (
          <AttributeDisplay
            label='攻击增伤'
            value={character.attackBoost ?? 0}
            factionId={factionId}
            isDetailed={isDetailed}
            path='attackBoost'
            className='text-amber-600 py-1'
          />
        )}
    </div>
  );
}
