'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { getNestedProperty, handleCharacterIdChange, setNestedProperty } from '@/lib/editUtils';
import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import {
  useEditMode,
  useLocalAchievement,
  useLocalBuff,
  useLocalCard,
  useLocalCharacter,
  useLocalEntity,
  useLocalFixture,
  useLocalItem,
  useLocalMap,
  useLocalMode,
  useLocalSpecialSkill,
} from '@/context/EditModeContext';
import {
  achievementsEdit,
  buffsEdit,
  cardsEdit,
  characters,
  entitiesEdit,
  fixturesEdit,
  itemsEdit,
  mapsEdit,
  modesEdit,
  specialSkillsEdit,
} from '@/data/index';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';

type Key<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends readonly (infer U)[]
        ? K | `${K}.${number}` | (U extends object ? `${K}.${Key<U>}` : never)
        : T[K] extends object
          ? K | `${K}.${Key<T[K]>}`
          : K;
    }[keyof T & string]
  : never;

type EditableScope =
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

type IntrinsicTagName = keyof HTMLElementTagNameMap;

type EditableFieldProps<TagName extends IntrinsicTagName> = Omit<
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

type EditableElementsProxy = {
  [TagName in IntrinsicTagName]: React.FC<EditableFieldProps<TagName>>;
};

const emptyObject = proxy({});
const EMPTY_EDITABLE_PLACEHOLDER = '<无内容>';

function createMissingEditableTargetError(
  scope: EditableScope,
  entityId: string,
  path: string
): Error {
  return new Error(`Cannot edit ${scope}.${path} because "${entityId}" is not loaded.`);
}

function useInlineEditableContent(opts: {
  initialValue: string | number;
  valueType: 'string' | 'number';
  isSingleLine: boolean;
  onSave?: ((newValue: string) => void) | undefined;
  enableEdit: boolean;
  readStoredValue: () => string | number | undefined;
  writeValue: (value: string | number) => void;
}) {
  const { initialValue, valueType, isSingleLine, onSave, enableEdit, readStoredValue, writeValue } =
    opts;

  const { isEditMode } = useEditMode();
  const [content, setContent] = useState<string | number>(initialValue);
  const contentRef = useRef<HTMLElement>(null);

  const setNodeRef = useCallback((node: HTMLElement | null) => {
    contentRef.current = node;
  }, []);

  useEffect(() => {
    try {
      const storedValue = readStoredValue();
      if (typeof storedValue === 'string' || typeof storedValue === 'number') {
        setContent(storedValue);
      } else {
        setContent(initialValue);
      }
    } catch (e) {
      console.error('Failed to read stored editable value', e);
      setContent(initialValue);
    }
  }, [initialValue, readStoredValue]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = String(content) || EMPTY_EDITABLE_PLACEHOLDER;
    }
  }, [content]);

  const handleBlur = useCallback(() => {
    if (!contentRef.current) return;
    const currentText = contentRef.current.textContent ?? '';
    if (currentText === String(content)) return;
    if (content === '' && currentText === EMPTY_EDITABLE_PLACEHOLDER) return;

    const newContentStr = currentText === EMPTY_EDITABLE_PLACEHOLDER ? '' : currentText;

    const trimmed = newContentStr.trim();
    const finalValue: string | number = valueType === 'number' ? parseFloat(trimmed) : trimmed;

    if (valueType === 'number') {
      if (typeof finalValue !== 'number' || Number.isNaN(finalValue)) {
        contentRef.current.textContent = String(content) || EMPTY_EDITABLE_PLACEHOLDER;
        return;
      }
    }

    try {
      if (onSave) {
        onSave(trimmed);
      } else {
        writeValue(finalValue);
      }
      setContent(finalValue);
    } catch (error) {
      console.error('Failed to save editable value:', error);
      contentRef.current.textContent = String(content) || EMPTY_EDITABLE_PLACEHOLDER;
    }
  }, [content, onSave, valueType, writeValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        contentRef.current?.blur();
      } else if (e.key === 'Enter' && isSingleLine) {
        e.preventDefault();
        contentRef.current?.blur();
      }
    },
    [isSingleLine]
  );

  return {
    isEditMode: isEditMode && enableEdit,
    content,
    setNodeRef,
    handleBlur,
    handleKeyDown,
  };
}

function EditableCharactersField<TagName extends IntrinsicTagName>({
  tag,
  path,
  initialValue,
  valueType: valueTypeProp,
  onSave,
  factionId,
  isSingleLine = false,
  enableEdit = true,
  ...rest
}: EditableFieldProps<TagName> & { tag: TagName }) {
  'use no memo';
  const { characterId } = useLocalCharacter();
  const rawLocalCharacter = characters[characterId];
  const localCharacterSnapshot = useSnapshot(rawLocalCharacter ?? emptyObject);
  const { handleSelectCharacter } = useAppContext();

  const valueType: 'string' | 'number' =
    valueTypeProp ?? (typeof initialValue === 'number' ? 'number' : 'string');

  const { isEditMode, content, setNodeRef, handleBlur, handleKeyDown } = useInlineEditableContent({
    initialValue,
    valueType,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue: () => getNestedProperty(localCharacterSnapshot, path),
    writeValue: (value) => {
      if (!rawLocalCharacter || !characterId) {
        throw createMissingEditableTargetError('characters', characterId || '<unknown>', path);
      }

      if ((path as string) === 'id') {
        const resolvedFactionId =
          factionId === 'cat' || factionId === 'mouse'
            ? factionId
            : rawLocalCharacter.factionId === 'cat' || rawLocalCharacter.factionId === 'mouse'
              ? rawLocalCharacter.factionId
              : undefined;
        if (!resolvedFactionId) {
          throw new Error(
            `Cannot edit characters.id because "${rawLocalCharacter.id}" has no faction.`
          );
        }

        handleCharacterIdChange(
          rawLocalCharacter.id,
          String(value),
          resolvedFactionId,
          handleSelectCharacter,
          true
        );
        return;
      }

      setNestedProperty(
        characters as unknown as Record<string, unknown>,
        `${rawLocalCharacter.id}.${path}`,
        value
      );
    },
  });

  if (isEditMode) {
    return React.createElement(
      tag,
      {
        contentEditable: 'plaintext-only',
        suppressContentEditableWarning: true,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
        ...(rest as React.ComponentPropsWithoutRef<TagName>),
      },
      String(content) || EMPTY_EDITABLE_PLACEHOLDER
    );
  }

  return React.createElement(
    tag,
    rest as React.ComponentPropsWithoutRef<TagName>,
    <TextWithHoverTooltips text={String(initialValue)} />
  );
}

function EditableCardsField<TagName extends IntrinsicTagName>({
  tag,
  path,
  initialValue,
  valueType: valueTypeProp,
  onSave,
  isSingleLine = false,
  enableEdit = true,
  ...rest
}: EditableFieldProps<TagName> & { tag: TagName }) {
  'use no memo';
  const { cardId } = useLocalCard();
  const rawLocalCard = cardsEdit[cardId];
  const localCardSnapshot = useSnapshot(rawLocalCard ?? emptyObject);

  const valueType: 'string' | 'number' =
    valueTypeProp ?? (typeof initialValue === 'number' ? 'number' : 'string');

  const { isEditMode, content, setNodeRef, handleBlur, handleKeyDown } = useInlineEditableContent({
    initialValue,
    valueType,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue: () => getNestedProperty(localCardSnapshot, path as string),
    writeValue: (value) => {
      if (!rawLocalCard || !cardId) {
        throw createMissingEditableTargetError('cards', cardId || '<unknown>', path as string);
      }

      // Knowledge card `id` is also the record key and route segment; avoid accidental breakage.
      if ((path as string) === 'id') {
        throw new Error('Editing knowledge card id is not supported in local edit mode.');
      }

      setNestedProperty(cardsEdit, `${cardId}.${path as string}`, value);
    },
  });

  if (isEditMode) {
    return React.createElement(
      tag,
      {
        contentEditable: 'plaintext-only',
        suppressContentEditableWarning: true,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
        ...(rest as React.ComponentPropsWithoutRef<TagName>),
      },
      String(content) || EMPTY_EDITABLE_PLACEHOLDER
    );
  }

  return React.createElement(
    tag,
    rest as React.ComponentPropsWithoutRef<TagName>,
    <TextWithHoverTooltips text={String(initialValue)} />
  );
}

function EditableRecordField<TagName extends IntrinsicTagName>({
  tag,
  path,
  initialValue,
  valueType: valueTypeProp,
  onSave,
  isSingleLine = false,
  enableEdit = true,
  scope,
  ...rest
}: EditableFieldProps<TagName> & {
  tag: TagName;
  scope: Exclude<EditableScope, 'characters' | 'cards'>;
}) {
  'use no memo';

  const { entityName } = useLocalEntity();
  const { achievementName } = useLocalAchievement();
  const { buffName } = useLocalBuff();
  const { itemName } = useLocalItem();
  const { fixtureName } = useLocalFixture();
  const { mapName } = useLocalMap();
  const { modeName } = useLocalMode();
  const { factionId, skillId } = useLocalSpecialSkill();

  const rawEntity = entitiesEdit[entityName];
  const rawAchievement = achievementsEdit[achievementName];
  const rawBuff = buffsEdit[buffName];
  const rawItem = itemsEdit[itemName];
  const rawFixture = fixturesEdit[fixtureName];
  const rawMap = mapsEdit[mapName];
  const rawMode = modesEdit[modeName];

  const rawSpecialSkill =
    factionId === 'cat'
      ? specialSkillsEdit.cat[skillId]
      : factionId === 'mouse'
        ? specialSkillsEdit.mouse[skillId]
        : undefined;

  const entitySnapshot = useSnapshot(rawEntity ?? emptyObject);
  const achievementSnapshot = useSnapshot(rawAchievement ?? emptyObject);
  const buffSnapshot = useSnapshot(rawBuff ?? emptyObject);
  const itemSnapshot = useSnapshot(rawItem ?? emptyObject);
  const fixtureSnapshot = useSnapshot(rawFixture ?? emptyObject);
  const mapSnapshot = useSnapshot(rawMap ?? emptyObject);
  const modeSnapshot = useSnapshot(rawMode ?? emptyObject);
  const specialSkillSnapshot = useSnapshot(rawSpecialSkill ?? emptyObject);

  const valueType: 'string' | 'number' =
    valueTypeProp ?? (typeof initialValue === 'number' ? 'number' : 'string');

  const readStoredValue = useCallback((): string | number | undefined => {
    switch (scope) {
      case 'entities':
        return getNestedProperty(entitySnapshot, path as string);
      case 'achievements':
        return getNestedProperty(achievementSnapshot, path as string);
      case 'buffs':
        return getNestedProperty(buffSnapshot, path as string);
      case 'items':
        return getNestedProperty(itemSnapshot, path as string);
      case 'fixtures':
        return getNestedProperty(fixtureSnapshot, path as string);
      case 'maps':
        return getNestedProperty(mapSnapshot, path as string);
      case 'modes':
        return getNestedProperty(modeSnapshot, path as string);
      case 'specialSkills':
        return getNestedProperty(specialSkillSnapshot, path as string);
      default:
        return undefined;
    }
  }, [
    scope,
    path,
    entitySnapshot,
    achievementSnapshot,
    buffSnapshot,
    itemSnapshot,
    fixtureSnapshot,
    mapSnapshot,
    modeSnapshot,
    specialSkillSnapshot,
  ]);

  const writeValue = useCallback(
    (value: string | number) => {
      // Avoid breaking route segment keys (these entities are keyed by name/skillId).
      if ((path as string) === 'name' || (path as string) === 'id') {
        throw new Error(
          `Editing ${String(path)} is not supported for ${scope} in local edit mode.`
        );
      }

      switch (scope) {
        case 'entities': {
          if (!entityName || !rawEntity) {
            throw createMissingEditableTargetError(
              scope,
              entityName || '<unknown>',
              path as string
            );
          }
          setNestedProperty(
            entitiesEdit as unknown as Record<string, unknown>,
            `${entityName}.${path as string}`,
            value
          );
          break;
        }
        case 'achievements': {
          if (!achievementName || !rawAchievement) {
            throw createMissingEditableTargetError(
              scope,
              achievementName || '<unknown>',
              path as string
            );
          }
          setNestedProperty(
            achievementsEdit as unknown as Record<string, unknown>,
            `${achievementName}.${path as string}`,
            value
          );
          break;
        }
        case 'buffs': {
          if (!buffName || !rawBuff) {
            throw createMissingEditableTargetError(scope, buffName || '<unknown>', path as string);
          }
          setNestedProperty(
            buffsEdit as unknown as Record<string, unknown>,
            `${buffName}.${path as string}`,
            value
          );
          break;
        }
        case 'items': {
          if (!itemName || !rawItem) {
            throw createMissingEditableTargetError(scope, itemName || '<unknown>', path as string);
          }
          setNestedProperty(
            itemsEdit as unknown as Record<string, unknown>,
            `${itemName}.${path as string}`,
            value
          );
          break;
        }
        case 'fixtures': {
          if (!fixtureName || !rawFixture) {
            throw createMissingEditableTargetError(
              scope,
              fixtureName || '<unknown>',
              path as string
            );
          }
          setNestedProperty(
            fixturesEdit as unknown as Record<string, unknown>,
            `${fixtureName}.${path as string}`,
            value
          );
          break;
        }
        case 'maps': {
          if (!mapName || !rawMap) {
            throw createMissingEditableTargetError(scope, mapName || '<unknown>', path as string);
          }
          setNestedProperty(
            mapsEdit as unknown as Record<string, unknown>,
            `${mapName}.${path as string}`,
            value
          );
          break;
        }
        case 'modes': {
          if (!modeName || !rawMode) {
            throw createMissingEditableTargetError(scope, modeName || '<unknown>', path as string);
          }
          setNestedProperty(
            modesEdit as unknown as Record<string, unknown>,
            `${modeName}.${path as string}`,
            value
          );
          break;
        }
        case 'specialSkills': {
          if (!factionId || !skillId || !rawSpecialSkill) {
            throw createMissingEditableTargetError(
              scope,
              `${factionId || '<unknown>'}.${skillId || '<unknown>'}`,
              path as string
            );
          }
          setNestedProperty(
            specialSkillsEdit as unknown as Record<string, unknown>,
            `${factionId}.${skillId}.${path as string}`,
            value
          );
          break;
        }
        default:
          break;
      }
    },
    [
      scope,
      path,
      entityName,
      rawEntity,
      achievementName,
      rawAchievement,
      buffName,
      rawBuff,
      itemName,
      rawItem,
      fixtureName,
      rawFixture,
      mapName,
      rawMap,
      modeName,
      rawMode,
      factionId,
      skillId,
      rawSpecialSkill,
    ]
  );

  const { isEditMode, content, setNodeRef, handleBlur, handleKeyDown } = useInlineEditableContent({
    initialValue,
    valueType,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue,
    writeValue,
  });

  if (isEditMode) {
    return React.createElement(
      tag,
      {
        contentEditable: 'plaintext-only',
        suppressContentEditableWarning: true,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
        ...(rest as React.ComponentPropsWithoutRef<TagName>),
      },
      String(content) || EMPTY_EDITABLE_PLACEHOLDER
    );
  }

  return React.createElement(
    tag,
    rest as React.ComponentPropsWithoutRef<TagName>,
    <TextWithHoverTooltips text={String(initialValue)} />
  );
}

const EDITABLE_PROXY_CACHE = new Map<EditableScope, EditableElementsProxy>();

const RESERVED_PROXY_KEYS = new Set<string>(['then', 'catch', 'finally', 'toString', 'valueOf']);

export function editable(scope: 'characters'): EditableElementsProxy;
export function editable(scope: 'cards'): EditableElementsProxy;
export function editable(
  scope: Exclude<EditableScope, 'characters' | 'cards'>
): EditableElementsProxy;
export function editable(scope: EditableScope): EditableElementsProxy {
  const existing = EDITABLE_PROXY_CACHE.get(scope);
  if (existing) return existing;

  const tagComponentCache = new Map<string, React.FC<EditableFieldProps<IntrinsicTagName>>>();

  const proxy = new Proxy({} as EditableElementsProxy, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (RESERVED_PROXY_KEYS.has(prop)) return undefined;

      const cached = tagComponentCache.get(prop);
      if (cached) return cached;

      const Tag = prop as IntrinsicTagName;

      const Field =
        scope === 'characters'
          ? EditableCharactersField
          : scope === 'cards'
            ? EditableCardsField
            : EditableRecordField;

      const Component: React.FC<EditableFieldProps<IntrinsicTagName>> = (props) => (
        // @ts-expect-error - internal generic routing by scope
        <Field tag={Tag} scope={scope} {...(props as EditableFieldProps<typeof Tag>)} />
      );

      Component.displayName = `editable(${scope}).${prop}`;
      tagComponentCache.set(prop, Component);
      return Component;
    },
  });

  EDITABLE_PROXY_CACHE.set(scope, proxy);
  return proxy;
}
