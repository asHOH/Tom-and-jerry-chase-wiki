import type React from 'react';

import type { characters } from '@/data';

export type CharacterRecord = (typeof characters)[string];

export type ParsedName = {
  baseName: string;
  categoryHint: string | null;
};

export type RenderTextPart = string | React.ReactElement;

export type DamageTagCategory =
  'source' | 'calculation' | 'electric' | 'shield' | 'injure' | 'bubble' | 'protection';

export type DamageTagEffects = {
  displayPrefixElements: React.ReactElement[];
  displaySuffixes: string[];
  tooltipAppends: string[];
  preventBoost: boolean;
};
