import type React from 'react';

import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';

type Key<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends readonly (infer U)[]
        ? K | `${K}.${number}` | (U extends object ? `${K}.${Key<U>}` : never)
        : T[K] extends object
          ? K | `${K}.${Key<T[K]>}`
          : K;
    }[keyof T & string]
  : never;

export type EditableScope =
  | 'characters'
  | 'cards'
  | 'entities'
  | 'buffs'
  | 'items'
  | 'fixtures'
  | 'maps'
  | 'modes'
  | 'specialSkills'
  | 'achievements';

type EditableCharactersPath = Key<CharacterWithFaction> | (string & {});
type EditableCardsPath = Key<KnowledgeCardWithFaction> | (string & {});

export type IntrinsicTagName = keyof HTMLElementTagNameMap;

export type EditableFieldProps<TagName extends IntrinsicTagName> = Omit<
  React.ComponentPropsWithoutRef<TagName>,
  'children'
> & {
  path: EditableCharactersPath | EditableCardsPath | (string & {});
  initialValue: string | number;
  valueType?: 'string' | 'number' | undefined;
  onSave?: ((newValue: string) => void) | undefined;
  factionId?: string | undefined;
  isSingleLine?: boolean;
  enableEdit?: boolean;
};

export type EditableElementsProxy = {
  [TagName in IntrinsicTagName]: React.FC<EditableFieldProps<TagName>>;
};
