import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditMode } from '../../context/EditModeContext';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import { Character, characters, factions } from '@/data';
import { useAppContext } from '@/context/AppContext';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';

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
  const { handleSelectCharacter, activeTab } = useAppContext();

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
      if (path && path.split('.')?.[1] == 'id') {
        // FIXME: This code may lead to uncertain damage as other code do not handle the situation where the id changes
        // characters is not managed by react, so we need to trigger the update manually
        // use of activeTab forces
        // TODO: save and load faction and character changes from localStorage
        const oldId = path.split('.')[0];
        characters[newContentStr] = characters[oldId!]!;
        characters[newContentStr].imageUrl = (
          activeTab == 'cat' ? getCatImageUrl : getMouseImageUrl
        )(newContentStr);
        delete characters[oldId!];
        handleSelectCharacter(newContentStr);
        localStorage.setItem(
          'editableFields',
          JSON.stringify(
            ((obj: Record<string, Character>) => {
              obj[newContentStr] = characters[oldId!]!;
              delete obj[oldId!];
              return obj;
            })(JSON.parse(localStorage.getItem('editableFields')!))
          )
        );
        const faction = factions[activeTab!]?.characters.find(({ id }) => id == oldId);
        if (faction) {
          faction.id = faction.name = newContentStr;
          faction.imageUrl = (activeTab == 'cat' ? getCatImageUrl : getMouseImageUrl)(
            newContentStr
          );
        }
      }
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
