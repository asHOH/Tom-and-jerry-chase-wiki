import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditMode } from '../../context/EditModeContext';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import { useAppContext } from '@/context/AppContext';
import { getNestedProperty, handleChange } from '@/lib/editUtils';

interface EditableFieldProps<T extends string | number> {
  tag: keyof HTMLElementTagNameMap;
  path: string; // e.g., 'character.id', 'character.description'
  initialValue: T;
  className?: string | undefined;
}

function EditableFieldImplementation<T extends string | number>({
  tag: Tag,
  path,
  initialValue,
  className,
}: EditableFieldProps<T>) {
  const [content, setContent] = useState<T>(initialValue);
  const contentRef = useRef<HTMLElement>(null);
  const { handleSelectCharacter, activeTab } = useAppContext();

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
    if (contentRef.current && contentRef.current.textContent != content) {
      const newContentStr = contentRef.current.textContent || '';

      if (typeof initialValue === 'number') {
        const parsedFloat = parseFloat(newContentStr);
        if (isNaN(parsedFloat)) {
          // Revert to the last valid content if input is not a number
          contentRef.current.textContent = content.toString();
          return;
        }
      }

      if (typeof initialValue === 'string') {
        setContent(newContentStr as T);
      } else {
        setContent(parseFloat(newContentStr) as T);
      }

      handleChange(
        initialValue,
        newContentStr,
        path,
        activeTab || undefined,
        handleSelectCharacter
      );
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
