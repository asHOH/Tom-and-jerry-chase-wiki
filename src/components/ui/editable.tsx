'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { getNestedProperty, handleChange, setNestedProperty } from '@/lib/editUtils';
import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalCard, useLocalCharacter } from '@/context/EditModeContext';
import { cardsEdit, characters } from '@/data/index';
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

type EditableScope = 'characters' | 'cards';

type EditableCharactersPath = Key<CharacterWithFaction> | (string & {});
type EditableCardsPath = Key<KnowledgeCardWithFaction> | (string & {});

type IntrinsicTagName = keyof HTMLElementTagNameMap;

type EditableFieldProps<TagName extends IntrinsicTagName> = Omit<
  React.ComponentPropsWithoutRef<TagName>,
  'children'
> & {
  path: EditableCharactersPath | EditableCardsPath;
  initialValue: string | number;
  onSave?: ((newValue: string) => void) | undefined;
  factionId?: string | undefined;
  isSingleLine?: boolean;
  enableEdit?: boolean;
};

type EditableElementsProxy = {
  [TagName in IntrinsicTagName]: React.FC<EditableFieldProps<TagName>>;
};

const emptyObject = proxy({});

function useInlineEditableContent(opts: {
  initialValue: string | number;
  isSingleLine: boolean;
  onSave?: ((newValue: string) => void) | undefined;
  enableEdit: boolean;
  readStoredValue: () => string | number | undefined;
  writeValue: (trimmed: string) => void;
}) {
  const { initialValue, isSingleLine, onSave, enableEdit, readStoredValue, writeValue } = opts;

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
      contentRef.current.textContent = String(content) || '<无内容>';
    }
  }, [content]);

  const handleBlur = useCallback(() => {
    if (!contentRef.current) return;
    if (contentRef.current.textContent === String(content)) return;

    const newContentStr = contentRef.current.textContent || '';

    if (typeof initialValue === 'number') {
      const parsedFloat = parseFloat(newContentStr);
      if (isNaN(parsedFloat)) {
        contentRef.current.textContent = String(content) || '<无内容>';
        return;
      }
    }

    if (typeof initialValue === 'string') {
      setContent(newContentStr);
    } else {
      setContent(parseFloat(newContentStr));
    }

    const trimmed = newContentStr.trim();
    if (onSave) {
      onSave(trimmed);
      return;
    }

    writeValue(trimmed);
  }, [content, initialValue, onSave, writeValue]);

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

  const { isEditMode, content, setNodeRef, handleBlur, handleKeyDown } = useInlineEditableContent({
    initialValue,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue: () => getNestedProperty(localCharacterSnapshot, path),
    writeValue: (trimmed) => {
      if (!rawLocalCharacter) return;
      handleChange(
        initialValue,
        trimmed,
        `${rawLocalCharacter.id}.${path}`,
        factionId || rawLocalCharacter.factionId || undefined,
        handleSelectCharacter
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
      String(content) || '<无内容>'
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
  onSave,
  isSingleLine = false,
  enableEdit = true,
  ...rest
}: EditableFieldProps<TagName> & { tag: TagName }) {
  'use no memo';
  const { cardId } = useLocalCard();
  const rawLocalCard = cardsEdit[cardId];
  const localCardSnapshot = useSnapshot(rawLocalCard ?? emptyObject);

  const { isEditMode, content, setNodeRef, handleBlur, handleKeyDown } = useInlineEditableContent({
    initialValue,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue: () => getNestedProperty(localCardSnapshot, path as string),
    writeValue: (trimmed) => {
      console.log({ trimmed, rawLocalCard, cardId });
      if (!rawLocalCard || !cardId) return;

      // Knowledge card `id` is also the record key and route segment; avoid accidental breakage.
      if ((path as string) === 'id') {
        console.warn('Editing knowledge card id is not supported in local edit mode yet.');
        return;
      }

      const finalValue = typeof initialValue === 'number' ? parseFloat(trimmed) : trimmed;
      setNestedProperty(cardsEdit, `${cardId}.${path as string}`, finalValue);
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
      String(content) || '<无内容>'
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

      const Field = scope === 'characters' ? EditableCharactersField : EditableCardsField;

      const Component: React.FC<EditableFieldProps<IntrinsicTagName>> = (props) => (
        <Field tag={Tag} {...(props as EditableFieldProps<typeof Tag>)} />
      );

      Component.displayName = `editable(${scope}).${prop}`;
      tagComponentCache.set(prop, Component);
      return Component;
    },
  });

  EDITABLE_PROXY_CACHE.set(scope, proxy);
  return proxy;
}
