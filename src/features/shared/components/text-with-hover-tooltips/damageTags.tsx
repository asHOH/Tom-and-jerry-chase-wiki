import React from 'react';

import type { DamageTagCategory, DamageTagEffects } from './types';

// ---------- Damage tag processing system ----------

type TagDefinition = {
  category: DamageTagCategory;
  names: string[]; // Includes primary name and aliases
  // Modify final display text: returns React elements to insert (bold, colors, etc.) and suffix strings
  processDisplay?: () => {
    prefixElement?: React.ReactElement; // Modifier inserted after the number, e.g. "无来源", "固定", "电击"
    suffixText?: string; // Text appended inside parentheses, e.g. "无视护盾"
    suffixNote?: string; // Note appended to tooltip
    preventBoost?: boolean; // Whether to prevent adding character boost
  };
};

// Tag definitions table
export const TAG_DEFINITIONS: TagDefinition[] = [
  {
    category: 'source',
    names: ['有来源', '有来源伤害'],
    // Default tag, no special effect
  },
  {
    category: 'source',
    names: ['无来源', '无来源伤害', '环境伤害', '环境'],
    processDisplay: () => ({
      prefixElement: <strong key='source'>{'无来源'}</strong>,
      suffixNote: '；该伤害无来源，不会触发来源相关效果',
      preventBoost: true,
    }),
  },
  {
    category: 'calculation',
    names: ['受双方影响', '可增', '可增型', '可增型伤害', '常规', '常规伤害'],
    processDisplay: () => ({
      suffixNote: '；会受到其它来源的攻击增伤/减伤，受击增伤/减伤等效果影响',
    }),
  },
  {
    category: 'calculation',
    names: [
      '只受目标影响',
      '受目标影响',
      '不受来源影响',
      '不增',
      '不增型',
      '不增型伤害',
      '不计来源影响',
    ],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'不计来源影响的'}</strong>,
      suffixNote: '；不受攻击增伤/减伤影响，但仍受受击增伤/减伤等其它效果影响',
      preventBoost: true,
    }),
  },
  {
    category: 'calculation',
    names: ['只受来源影响', '受来源影响', '不受目标影响', '不计目标影响'],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'不计目标影响的'}</strong>,
      suffixNote: '；不受受击增伤/减伤影响，但仍受攻击增伤/减伤等其它效果影响',
    }),
  },
  {
    category: 'calculation',
    names: [
      '不受双方影响',
      '不受影响',
      '固定值伤害',
      '固定型伤害',
      '固定',
      '固定值',
      '固定型',
      '不变型',
      '不变值',
      '不变型伤害',
      '不变值伤害',
    ],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'固定'}</strong>,
      suffixNote: '；不受包括攻击增伤/减伤、受击增伤/减伤等效果在内的大多数效果的影响',
      preventBoost: true,
    }),
  },
  {
    category: 'electric',
    names: ['电击', '电击伤害'],
    processDisplay: () => ({
      prefixElement: (
        <strong key='electric' className='text-blue-600 dark:text-blue-400'>
          {'电击'}
        </strong>
      ),
      suffixNote:
        '；可对目标造成感电，一段时间内目标受到的电击伤害增加，可叠加，目标遇水时发生电爆炸并失去感电',
    }),
  },
  {
    category: 'shield',
    names: ['可攻击护盾', '可击破护盾', '可破盾', '可破盾伤害'],
    processDisplay: () => ({
      suffixText: '可破盾',
      suffixNote: '；会被护盾抵挡且正常消耗护盾层数',
    }),
  },
  {
    category: 'shield',
    names: [
      '不可攻击护盾',
      '不可击破护盾',
      '不可破盾',
      '不可破盾伤害',
      '无法攻击护盾',
      '无法击破护盾',
      '无法破盾',
      '无法破盾伤害',
    ],
    processDisplay: () => ({
      suffixText: '不破盾',
      suffixNote: '；会被护盾完全抵挡，不消耗护盾层数',
    }),
  },
  {
    category: 'shield',
    names: [
      '无视护盾',
      '无视护盾伤害',
      '穿透',
      '穿透护盾',
      '穿透伤害',
      '穿透护盾伤害',
      '真实',
      '真实伤害',
    ],
    processDisplay: () => ({
      suffixText: '无视护盾',
      suffixNote:
        '；无视包括护盾在内的绝大多数保护效果，直接对目标造成伤害，但由此引发虚弱时可能会被护盾等状态抵消',
    }),
  },
  {
    category: 'injure',
    names: ['可致伤', '可导致受伤', '会导致受伤', '会致伤'],
    processDisplay: () => ({
      suffixText: '可致伤',
      suffixNote: '；成功命中目标且未被护盾等效果抵挡时，使目标进入受伤状态',
    }),
  },
  {
    category: 'injure',
    names: ['不可致伤', '不可导致受伤', '不会导致受伤', '不会致伤'],
    processDisplay: () => ({
      suffixText: '不可致伤',
      suffixNote: '；不会使目标进入受伤状态',
    }),
  },
  {
    category: 'bubble',
    names: ['可攻击泡泡', '可击破泡泡'],
    processDisplay: () => ({
      suffixText: '可攻击泡泡',
      suffixNote: '；可以正常攻击泡泡',
    }),
  },
  {
    category: 'bubble',
    names: ['不可攻击泡泡', '不可击破泡泡'],
    processDisplay: () => ({
      suffixText: '不可攻击泡泡',
      suffixNote: '；无法攻击泡泡',
    }),
  },
  {
    category: 'protection',
    names: [
      '无视保护机制',
      '无视保护',
      '无视伤害保护机制',
      '不受保护机制',
      '不受保护',
      '不受伤害保护机制',
    ],
    processDisplay: () => ({
      suffixText: '无视伤害保护',
      suffixNote: '；不会触发猫方伤害保护机制的减伤效果，也不受此类减伤的影响',
    }),
  },
];

// Parse tag strings and return effects in order of appearance
export function parseDamageTags(rawTags: string[]): DamageTagEffects {
  const displayPrefixElements: React.ReactElement[] = [];
  const displaySuffixes: string[] = [];
  const tooltipAppends: string[] = [];
  let preventBoost = false;

  const seenCategories = new Set<DamageTagCategory>();
  let sourceDefApplied: TagDefinition | undefined;

  // Process tags in order, but skip categories already processed
  for (const rawTag of rawTags) {
    const trimmed = rawTag.trim();
    if (!trimmed) continue;

    // Find matching tag definition
    const def = TAG_DEFINITIONS.find((d) =>
      d.names.some((name) => name.toLowerCase() === trimmed.toLowerCase())
    );
    if (!def) continue;

    // Only take the first tag of each category
    if (seenCategories.has(def.category)) continue;
    seenCategories.add(def.category);

    if (def.category === 'source') {
      sourceDefApplied = def;
    }

    if (def.processDisplay) {
      const result = def.processDisplay();

      // Hide prefix for "只受目标影响" when "无来源" is also present
      if (def.category === 'calculation') {
        const isNoSourcePresent = sourceDefApplied?.names.includes('无来源') ?? false;
        const isUninfluencedBySource =
          def.names.includes('只受目标影响') || def.names.includes('不受来源影响');
        if (isNoSourcePresent && isUninfluencedBySource) {
          // Apply preventBoost and suffixNote, but skip prefixElement
          if (result.preventBoost) preventBoost = true;
          if (result.suffixNote) tooltipAppends.push(result.suffixNote);
          continue;
        }
      }

      if (result.prefixElement) {
        displayPrefixElements.push(result.prefixElement);
      }
      if (result.suffixText) {
        displaySuffixes.push(result.suffixText);
      }
      if (result.suffixNote) {
        tooltipAppends.push(result.suffixNote);
      }
      if (result.preventBoost) {
        preventBoost = true;
      }
    }
  }

  // Default calculation category if none specified
  if (!seenCategories.has('calculation')) {
    const hasNoSource = sourceDefApplied?.names.includes('无来源') ?? false;
    let defaultCalcDef: TagDefinition | undefined;
    if (hasNoSource) {
      defaultCalcDef = TAG_DEFINITIONS.find(
        (d) => d.category === 'calculation' && d.names.includes('只受目标影响')
      );
    } else {
      defaultCalcDef = TAG_DEFINITIONS.find(
        (d) => d.category === 'calculation' && d.names.includes('受双方影响')
      );
    }

    if (defaultCalcDef?.processDisplay) {
      const result = defaultCalcDef.processDisplay();

      if (result.preventBoost) {
        preventBoost = true;
      }

      if (result.suffixNote) {
        // Insert after any source note (contains '该伤害无来源')
        let insertIndex = tooltipAppends.length;
        for (let i = 0; i < tooltipAppends.length; i++) {
          if (tooltipAppends[i]?.includes('该伤害无来源')) {
            insertIndex = i + 1;
            break;
          }
        }
        tooltipAppends.splice(insertIndex, 0, result.suffixNote);
      }

      // Add prefix only if not the hidden "只受目标影响" + "无来源" combo
      const isNoSourceAndTargetOnly = hasNoSource && defaultCalcDef.names.includes('只受目标影响');
      if (!isNoSourceAndTargetOnly && result.prefixElement) {
        displayPrefixElements.push(result.prefixElement);
      }
    }
  }

  return { displayPrefixElements, displaySuffixes, tooltipAppends, preventBoost };
}

// ---------- End of tag processing ----------
