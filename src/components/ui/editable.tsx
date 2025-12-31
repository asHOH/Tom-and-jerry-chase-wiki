/* eslint-disable react-hooks/refs */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getNestedProperty, handleChange } from '@/lib/editUtils';
import type { CharacterWithFaction } from '@/lib/types';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data/index';
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

type EditableScope = 'characters';

type EditableCharactersPath = Key<CharacterWithFaction> | (string & {});

type IntrinsicTagName = keyof HTMLElementTagNameMap;

type EditableFieldProps<TagName extends IntrinsicTagName> = Omit<
  React.ComponentPropsWithoutRef<TagName>,
  'children'
> & {
  path: EditableCharactersPath;
  initialValue: string | number;
  onSave?: ((newValue: string) => void) | undefined;
  factionId?: string | undefined;
  isSingleLine?: boolean;
  enableEdit?: boolean;
};

type EditableElementsProxy = {
  [TagName in IntrinsicTagName]: React.FC<EditableFieldProps<TagName>>;
};

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
  const { isEditMode } = useEditMode();

  const [content, setContent] = useState<string | number>(initialValue);
  const contentRef = useRef<HTMLElement>(null);
  const { characterId } = useLocalCharacter();
  const localCharacter = characters[characterId];
  const { handleSelectCharacter } = useAppContext();

  useEffect(() => {
    try {
      if (!localCharacter) {
        setContent(initialValue);
        return;
      }
      const storedValue = getNestedProperty<string | number>(localCharacter, path);
      if (typeof storedValue === 'string' || typeof storedValue === 'number') {
        setContent(storedValue);
      } else {
        setContent(initialValue);
      }
    } catch (e) {
      console.error('Failed to read stored editable value', e);
      setContent(initialValue);
    }
  }, [path, initialValue, localCharacter]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = String(content) || '<无内容>';
    }
  }, [content]);

  const handleBlurRef = useRef<() => void>(() => {});

  handleBlurRef.current = () => {
    if (contentRef.current && contentRef.current.textContent !== String(content)) {
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

      if (onSave) {
        onSave(newContentStr.trim());
      } else {
        if (localCharacter) {
          handleChange(
            initialValue,
            newContentStr.trim(),
            `${localCharacter.id}.${path}`,
            factionId || localCharacter.factionId || undefined,
            handleSelectCharacter
          );
        }
      }
    }
  };

  const handleBlur = useCallback(() => handleBlurRef.current(), []);

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

  if (isEditMode && enableEdit) {
    return React.createElement(
      tag,
      {
        contentEditable: 'plaintext-only',
        suppressContentEditableWarning: true,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        ref: contentRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
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

export function editable(scope: 'characters'): EditableElementsProxy {
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

      const Component: React.FC<EditableFieldProps<IntrinsicTagName>> = (props) => (
        <EditableCharactersField tag={Tag} {...(props as EditableFieldProps<typeof Tag>)} />
      );

      Component.displayName = `editable(${scope}).${prop}`;
      tagComponentCache.set(prop, Component);
      return Component;
    },
  });

  EDITABLE_PROXY_CACHE.set(scope, proxy);
  return proxy;
}
