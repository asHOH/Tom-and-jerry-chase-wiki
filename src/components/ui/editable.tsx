'use client';

import React from 'react';

import { EditableCardsField, EditableCharactersField, EditableRecordField } from './editableFields';
import type {
  EditableElementsProxy,
  EditableFieldProps,
  EditableScope,
  IntrinsicTagName,
} from './editableTypes';

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
