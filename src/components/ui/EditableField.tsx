import React, { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useEditMode } from '../../context/EditModeContext';

interface EditableFieldProps<T extends string | number> {
  tag: keyof HTMLElementTagNameMap;
  path: string; // e.g., 'character.id', 'character.description'
  initialValue: T;
  className?: string;
  children?: ReactNode;
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

function EditableField<T extends string | number>({
  tag: Tag,
  path,
  initialValue,
  className,
  children,
}: EditableFieldProps<T>) {
  const { isEditMode } = useEditMode();
  const [content, setContent] = useState<T>(initialValue);
  const contentRef = useRef<HTMLElement>(null);

  // Function to get nested property from an object based on a path string

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
    if (isEditMode) {
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
    } else {
      // If edit mode is off, revert to initial value and clear local storage for this path
      setContent(initialValue);
      const storedData = localStorage.getItem('editableFields');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          const newParsedData: Record<string, unknown> = { ...parsedData };
          // Simple way to remove the property, might need more robust deep removal for complex paths
          const parts = path.split('.');
          if (parts.length === 1) {
            const keyToDelete = parts[0];
            if (typeof keyToDelete === 'string') {
              delete newParsedData[keyToDelete];
            }
          } else {
            let current: Record<string, unknown> | null = newParsedData;
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (
                typeof current !== 'object' ||
                current === null ||
                typeof part !== 'string' ||
                !(part in current)
              ) {
                current = null; // Path not found or invalid, nothing to delete
                break;
              }
              current = current[part] as Record<string, unknown>;
            }
            const lastPart = parts[parts.length - 1];
            if (current && typeof current === 'object' && typeof lastPart === 'string') {
              delete current[lastPart];
            }
          }

          localStorage.setItem('editableFields', JSON.stringify(newParsedData));
        } catch (e) {
          console.error('Failed to parse localStorage data on edit mode off', e);
        }
      }
    }
  }, [isEditMode, path, initialValue]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = content.toString();
    }
  }, [content]);

  const handleBlurRef = useRef<() => void>(() => {});

  handleBlurRef.current = () => {
    console.log({ initialValue, contentRef });
    if (isEditMode && contentRef.current) {
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
      localStorage.setItem('editableFields', JSON.stringify(newData));
    }
  };

  const handleBlur = useCallback(() => handleBlurRef.current(), []);

  return React.createElement(
    Tag,
    {
      className: className,
      contentEditable: isEditMode ? 'plaintext-only' : false,
      suppressContentEditableWarning: true,
      onBlur: handleBlur,
      ref: contentRef,
    },
    children || content
  );
}

export default EditableField;
