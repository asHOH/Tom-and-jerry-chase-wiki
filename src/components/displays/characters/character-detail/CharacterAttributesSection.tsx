import React from 'react';
import AttributeDisplay from './AttributeDisplay';
import { Character, FactionId } from '@/data/types';

interface CharacterAttribute {
  label: string;
  value: string | number;
  condition: boolean;
  className?: string;
}

interface CharacterAttributesSectionProps {
  character: Character;
  factionId: FactionId;
  isDetailed: boolean;
}

export default function CharacterAttributesSection({
  character,
  factionId,
  isDetailed,
}: CharacterAttributesSectionProps) {
  const commonAttributes: CharacterAttribute[] = [
    {
      label: 'Hp上限',
      value: character.maxHp || 0,
      condition: !!character.maxHp,
    },
    {
      label: 'Hp恢复',
      value: character.hpRecovery || 0,
      condition: !!character.hpRecovery,
    },
    {
      label: '移速',
      value: character.moveSpeed || 0,
      condition: !!character.moveSpeed,
    },
  ];

  const mouseAttributes: CharacterAttribute[] = [
    {
      label: '跳跃',
      value: character.jumpHeight || 0,
      condition: !!character.jumpHeight && factionId === 'mouse',
    },
    {
      label: '攻击增伤',
      value: character.attackBoost || 0,
      condition:
        factionId === 'mouse' && character.attackBoost !== undefined && character.attackBoost !== 0,
    },
    {
      label: '推速',
      value: `${character.cheesePushSpeed || 0} %/秒`,
      condition: factionId === 'mouse' && !!character.cheesePushSpeed,
    },
    {
      label: '墙缝增伤',
      value: character.wallCrackDamageBoost || 0,
      condition: factionId === 'mouse' && !!character.wallCrackDamageBoost,
    },
  ];

  const catAttributes: CharacterAttribute[] = [
    {
      label: '爪刀范围',
      value: character.clawKnifeRange || 0,
      condition: factionId === 'cat' && !!character.clawKnifeRange,
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
          className={attr.className}
        />
      ))}

      {factionId === 'cat' &&
        character.attackBoost !== undefined &&
        character.attackBoost !== 0 && (
          <AttributeDisplay
            label='攻击增伤'
            value={character.attackBoost}
            factionId={factionId}
            isDetailed={isDetailed}
            className='text-amber-600 py-1'
          />
        )}
    </div>
  );
}
