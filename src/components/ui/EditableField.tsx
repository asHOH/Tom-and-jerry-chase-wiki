import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditMode } from '../../context/EditModeContext';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import { characters } from '@/data';

interface EditableFieldProps<T extends string | number> {
  tag: keyof HTMLElementTagNameMap;
  path: string; // e.g., 'character.id', 'character.description'
  initialValue: T;
  className?: string | undefined;
}

function getNestedProperty<T extends string | number>(obj: Record<string, unknown>, path: string) {
  return path
    .split('.')
    .reduce(
      (acc: unknown, part: string) =>
        acc &&
        typeof acc === 'object' &&
        typeof part === 'string' &&
        part in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    ) as unknown as T;
}

function EditableFieldImplementation<T extends string | number>({
  tag: Tag,
  path,
  initialValue,
  className,
}: EditableFieldProps<T>) {
  const [content, setContent] = useState<T>(initialValue);
  const contentRef = useRef<HTMLElement>(null);

  // Function to set nested property on an object based on a path string
  const setNestedProperty = (obj: Record<string, unknown>, path: string, value: T): void => {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (typeof current !== 'object' || current === null) {
        return;
      }
      if (typeof part !== 'string') {
        return;
      }
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    const lastPart = parts[parts.length - 1];
    if (typeof current === 'object' && current !== null && typeof lastPart === 'string') {
      current[lastPart] = value;
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('editableFields');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        const storedValue = getNestedProperty<T>(parsedData, path);
        if (typeof storedValue === 'string' || typeof storedValue === 'number') {
          setContent(storedValue);
        } else {
          setContent(initialValue);
        }
      } catch (e) {
        console.error('Failed to parse localStorage data', e);
        setContent(initialValue);
      }
    } else {
      setContent(initialValue);
    }
  }, [path, initialValue]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = content.toString();
    }
  }, [content]);

  const handleBlurRef = useRef<() => void>(() => {});

  handleBlurRef.current = () => {
    if (contentRef.current) {
      const newContentStr = contentRef.current.textContent || '';

      if (typeof initialValue === 'number') {
        const parsedFloat = parseFloat(newContentStr);
        if (isNaN(parsedFloat)) {
          // Revert to the last valid content if input is not a number
          contentRef.current.textContent = content.toString();
          return;
        }
      }

      setContent(
        (typeof initialValue === 'string' ? newContentStr : parseFloat(newContentStr)) as T
      );

      const storedData = localStorage.getItem('editableFields');
      let parsedData: Record<string, unknown> = {};
      if (storedData) {
        try {
          parsedData = JSON.parse(storedData);
        } catch (e) {
          console.error('Failed to parse localStorage data on blur', e);
        }
      }

      const newData: Record<string, unknown> = { ...parsedData };
      let finalValue: T;
      if (typeof initialValue === 'number') {
        finalValue = parseFloat(newContentStr) as T;
      } else {
        finalValue = newContentStr as T;
      }
      setNestedProperty(newData, path, finalValue);
      setNestedProperty(characters, path, finalValue);
      localStorage.setItem('editableFields', JSON.stringify(newData));
    }
  };

  const handleBlur = useCallback(() => handleBlurRef.current(), []);

  return React.createElement(
    Tag,
    {
      className: className,
      contentEditable: 'plaintext-only',
      suppressContentEditableWarning: true,
      onBlur: handleBlur,
      ref: contentRef,
    },
    content.toString()
  );
}

function EditableField<T extends string | number>({
  tag: Tag,
  path,
  initialValue,
  className,
}: EditableFieldProps<T>) {
  const { isEditMode } = useEditMode();
  return isEditMode ? (
    <EditableFieldImplementation
      tag={Tag}
      path={path}
      initialValue={initialValue}
      className={className}
    />
  ) : (
    React.createElement(
      Tag,
      { className },
      <TextWithHoverTooltips text={initialValue.toString()} />
    )
  );
}

export default EditableField;
