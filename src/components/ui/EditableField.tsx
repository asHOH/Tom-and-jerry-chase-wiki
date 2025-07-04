import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditMode, useLocalCharacter } from '../../context/EditModeContext';
import TextWithHoverTooltips from '../displays/characters/shared/TextWithHoverTooltips';
import { useAppContext } from '@/context/AppContext';
import { getNestedProperty, handleChange } from '@/lib/editUtils';

/**
 * A component that displays a field that can be edited when in "edit mode".
 *
 * In normal mode, it renders the provided text within the specified HTML tag,
 * with hover tooltips enabled.
 *
 * In edit mode, it renders a `contentEditable` element. When the user clicks
 * away (on blur), the new content is saved to `localStorage` under the
 * 'characters' key, using the `path` to structure the data. It also
 * updates the application's state.
 *
 * @param {keyof HTMLElementTagNameMap} tag The HTML tag to use for the element (e.g., 'span', 'p', 'h1').
 * @param {string} path A dot-separated string representing the nested path to the value being edited (e.g., 'characterId.description'). This is used as a key for storing the edited value.
 * @param {T} initialValue The initial value of the field. Can be a string or a number.
 * @param {string} [className] Optional CSS classes to apply to the element.
 * @param {((newValue: string) => void) | undefined} [onSave] Optional function to invoke to replace default behavior.
 */
interface EditableFieldProps<T> {
  tag: keyof HTMLElementTagNameMap;
  path: string; // e.g., 'character.id', 'character.description'
  initialValue: T;
  className?: string | undefined;
  onSave?: ((newValue: string) => void) | undefined;
}

function EditableFieldImplementation<T>({
  tag: Tag,
  path,
  initialValue,
  className,
  onSave,
}: EditableFieldProps<T>) {
  const [content, setContent] = useState<T>(initialValue);
  const contentRef = useRef<HTMLElement>(null);
  const { handleSelectCharacter, activeTab } = useAppContext();

  useEffect(() => {
    const storedData = localStorage.getItem('characters');
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
  }, [path, initialValue, setContent]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = String(content) || '<无内容>';
    }
  }, [content]);

  const { localCharacter, setLocalCharacter } = useLocalCharacter();

  const handleBlurRef = useRef<() => void>(() => {});

  handleBlurRef.current = () => {
    if (contentRef.current && content === '') {
      contentRef.current!.textContent = '<无内容>';
    }

    if (contentRef.current && contentRef.current.textContent !== String(content)) {
      const newContentStr = contentRef.current.textContent || '';

      if (typeof initialValue === 'number') {
        const parsedFloat = parseFloat(newContentStr);
        if (isNaN(parsedFloat)) {
          // Revert to the last valid content if input is not a number
          contentRef.current.textContent = String(content) || '<无内容>';
          return;
        }
      }

      if (typeof initialValue === 'string') {
        setContent(newContentStr as T);
      } else {
        setContent(parseFloat(newContentStr) as T);
      }

      if (onSave) {
        onSave(newContentStr);
      } else {
        handleChange(
          initialValue,
          newContentStr,
          path,
          activeTab || undefined,
          handleSelectCharacter,
          localCharacter,
          setLocalCharacter
        );
      }
    }
  };

  const handleBlur = useCallback(() => handleBlurRef.current(), []);

  return React.createElement(
    Tag,
    {
      className: className + ' whitespace-pre-wrap',
      contentEditable: 'plaintext-only',
      suppressContentEditableWarning: true,
      onBlur: handleBlur,
      ref: contentRef,
    },
    String(content) || '<无内容>'
  );
}

function EditableField<T>({
  tag: Tag,
  path,
  initialValue,
  className,
  onSave,
}: EditableFieldProps<T>) {
  const { isEditMode } = useEditMode();
  return isEditMode ? (
    <EditableFieldImplementation
      tag={Tag}
      path={path}
      initialValue={initialValue}
      className={className}
      onSave={onSave}
    />
  ) : (
    React.createElement(Tag, { className }, <TextWithHoverTooltips text={String(initialValue)} />)
  );
}

export default EditableField;
