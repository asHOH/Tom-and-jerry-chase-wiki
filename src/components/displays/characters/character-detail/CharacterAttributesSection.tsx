import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data';
import { FactionId } from '@/data/types';
import { useSnapshot } from 'valtio';

import AttributeDisplay from './AttributeDisplay';

interface CharacterAttribute {
  label: string;
  value: string | number;
  condition: boolean;
  className?: string;
  path?: string;
  suffix?: string;
}

interface CharacterAttributesSectionProps {
  factionId: FactionId;
}

export default function CharacterAttributesSection({ factionId }: CharacterAttributesSectionProps) {
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const commonAttributes: CharacterAttribute[] = [
    {
      label: '别名',
      value: 0,
      condition: isEditMode,
    },
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
      condition: factionId === 'mouse',
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
      condition: factionId === 'mouse',
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
      value: `${character.clawKnifeCdUnhit || 0}${character.specialClawKnifeCdUnhit ? ' (' + character.specialClawKnifeCdUnhit + ')' : ''} / ${character.clawKnifeCdHit || 0}${character.specialClawKnifeCdHit ? ' (' + character.specialClawKnifeCdHit + ')' : ''} 秒`,
      condition: factionId === 'cat' && !!character.clawKnifeCdHit && !!character.clawKnifeCdUnhit,
    },
    {
      label: '初始道具',
      value: character.initialItem as string,
      condition:
        factionId === 'cat' && !!character.initialItem && character.initialItem !== '老鼠夹',
      className: 'text-sm text-amber-600 dark:text-amber-400 py-1',
      path: `initialItem`,
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
              className: `${
                attr.className || 'text-sm text-gray-700 dark:text-gray-300 py-1'
              } col-span-2`,
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
            className='py-1 text-sm text-amber-600 dark:text-amber-400'
          />
        )}
    </div>
  );
}
