'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { proxy, useSnapshot } from 'valtio';

import { getNestedProperty, handleCharacterIdChange, setNestedProperty } from '@/lib/editUtils';
import {
  CATEGORY_HINTS,
  type CharacterWithFaction,
  type KnowledgeCardWithFaction,
} from '@/lib/types';
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
  cards,
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
const MAX_AUTOCOMPLETE_ITEMS = 12;
const AUTOCOMPLETE_VIEWPORT_PADDING = 8;
const AUTOCOMPLETE_FALLBACK_WIDTH = 224;

type PairOpenBrace = '{' | '[';

type EditableAutocompleteSource =
  | '角色'
  | '知识卡'
  | '技能'
  | '特技'
  | '道具'
  | '衍生物'
  | '状态'
  | '场景'
  | '地图'
  | '模式'
  | '成就'
  | '分类';

type EditableAutocompleteCandidate = {
  label: string;
  insertText: string;
  source: EditableAutocompleteSource;
  pinyin: string;
  pinyinInitials: string;
};

type CaretViewportPosition = {
  top: number;
  left: number;
};

type BraceAutocompleteContext = {
  openBraceIndex: number;
  caretOffset: number;
  query: string;
};

let editableAutocompleteCandidatesPromise: Promise<EditableAutocompleteCandidate[]> | null = null;
let pinyinModulePromise: Promise<typeof import('pinyin-pro')> | null = null;

function normalizeAutocompleteInput(input: string): string {
  return input.toLowerCase().replace(/['\s]+/g, '');
}

function getPinyinModule() {
  if (!pinyinModulePromise) {
    pinyinModulePromise = import('pinyin-pro');
  }
  return pinyinModulePromise;
}

async function toPinyinTokens(text: string): Promise<{ full: string; initials: string }> {
  if (!text.trim()) {
    return { full: '', initials: '' };
  }

  const pinyinModule = await getPinyinModule();
  const syllables = pinyinModule.pinyin(text, {
    toneType: 'none',
    v: true,
    type: 'array',
  });

  const normalized = syllables.map((syllable) => normalizeAutocompleteInput(String(syllable)));
  return {
    full: normalized.join(''),
    initials: normalized.map((syllable) => syllable[0] ?? '').join(''),
  };
}

async function buildEditableAutocompleteCandidates(): Promise<EditableAutocompleteCandidate[]> {
  const dedup = new Map<
    string,
    { label: string; insertText: string; source: EditableAutocompleteSource }
  >();

  const add = (value: string | undefined, source: EditableAutocompleteSource) => {
    const normalized = value?.trim();
    if (!normalized || dedup.has(normalized)) {
      return;
    }
    dedup.set(normalized, {
      label: normalized,
      insertText: normalized,
      source,
    });
  };

  const addAliases = (aliases: unknown, source: EditableAutocompleteSource) => {
    if (!Array.isArray(aliases)) {
      return;
    }

    aliases.forEach((alias) => {
      if (typeof alias === 'string') {
        add(alias, source);
      }
    });
  };

  const addFromRecord = (record: Record<string, unknown>, source: EditableAutocompleteSource) => {
    Object.entries(record).forEach(([recordKey, rawEntry]) => {
      add(recordKey, source);

      if (!rawEntry || typeof rawEntry !== 'object') {
        return;
      }

      const entry = rawEntry as Record<string, unknown>;
      if (typeof entry.name === 'string') {
        add(entry.name, source);
      }
      if (typeof entry.id === 'string') {
        add(entry.id, source);
      }

      addAliases(entry.aliases, source);
    });
  };

  Object.entries(characters).forEach(([name, character]) => {
    add(name, '角色');
    add(character.id, '角色');
    addAliases(character.aliases, '角色');
    character.skills.forEach((skill) => {
      add(skill.name, '技能');
      addAliases(skill.aliases, '技能');
    });
  });

  Object.entries(cards).forEach(([name, card]) => {
    add(name, '知识卡');
    add(card.id, '知识卡');
    if ('aliases' in card && Array.isArray(card.aliases)) {
      card.aliases.forEach((alias) => add(alias, '知识卡'));
    }
  });

  addFromRecord(itemsEdit as unknown as Record<string, unknown>, '道具');
  addFromRecord(entitiesEdit as unknown as Record<string, unknown>, '衍生物');
  addFromRecord(buffsEdit as unknown as Record<string, unknown>, '状态');
  addFromRecord(fixturesEdit as unknown as Record<string, unknown>, '场景');
  addFromRecord(mapsEdit as unknown as Record<string, unknown>, '地图');
  addFromRecord(modesEdit as unknown as Record<string, unknown>, '模式');
  addFromRecord(achievementsEdit as unknown as Record<string, unknown>, '成就');
  addFromRecord(specialSkillsEdit.cat as unknown as Record<string, unknown>, '特技');
  addFromRecord(specialSkillsEdit.mouse as unknown as Record<string, unknown>, '特技');

  CATEGORY_HINTS.forEach((hint) => add(hint, '分类'));

  const candidates = await Promise.all(
    Array.from(dedup.values()).map(async (candidate) => {
      const pinyinTokens = await toPinyinTokens(candidate.label);
      return {
        ...candidate,
        pinyin: pinyinTokens.full,
        pinyinInitials: pinyinTokens.initials,
      };
    })
  );

  return candidates.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
}

function getEditableAutocompleteCandidates() {
  if (!editableAutocompleteCandidatesPromise) {
    editableAutocompleteCandidatesPromise = buildEditableAutocompleteCandidates();
  }
  return editableAutocompleteCandidatesPromise;
}

function getSelectionRangeWithinElement(element: HTMLElement): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) {
    return null;
  }

  return range;
}

function getCaretOffsetInElement(element: HTMLElement): number | null {
  const range = getSelectionRangeWithinElement(element);
  if (!range) {
    return null;
  }

  const preRange = range.cloneRange();
  preRange.selectNodeContents(element);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function setCaretOffsetInElement(element: HTMLElement, offset: number): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);

  let targetOffset = Math.max(0, offset);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    const length = textNode.nodeValue?.length ?? 0;
    if (targetOffset <= length) {
      range.setStart(textNode, targetOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    targetOffset -= length;
    currentNode = walker.nextNode();
  }

  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function setElementTextAndCaret(element: HTMLElement, nextText: string, caretOffset: number): void {
  element.textContent = nextText;
  setCaretOffsetInElement(element, caretOffset);
}

function isPairOpenBrace(char: string): char is PairOpenBrace {
  return char === '{' || char === '[';
}

function deletePairedBraceAtCaret(
  element: HTMLElement,
  direction: 'backward' | 'forward'
): boolean {
  const range = getSelectionRangeWithinElement(element);
  if (!range || !range.collapsed) {
    return false;
  }

  const caretOffset = getCaretOffsetInElement(element);
  if (caretOffset == null) {
    return false;
  }

  const text = element.textContent ?? '';
  const openIndex = direction === 'backward' ? caretOffset - 1 : caretOffset;
  const closeIndex = openIndex + 1;
  const openCharRaw = text[openIndex];

  if (
    openIndex < 0 ||
    closeIndex >= text.length ||
    typeof openCharRaw !== 'string' ||
    !isPairOpenBrace(openCharRaw)
  ) {
    return false;
  }

  const openChar = openCharRaw;
  const closeChar = text[closeIndex] ?? '';
  if (openChar == '{') {
    if (closeChar !== '}') return false;
    const nextText = text.slice(0, openIndex) + text.slice(closeIndex + 1);
    const nextCaretOffset = direction === 'backward' ? openIndex : caretOffset;
    setElementTextAndCaret(element, nextText, nextCaretOffset);
    return true;
  } else {
    if (closeIndex + 2 >= text.length || text.slice(closeIndex, closeIndex + 3) !== ']()')
      return false;
    const nextText = text.slice(0, openIndex) + text.slice(closeIndex + 3);
    const nextCaretOffset = direction === 'backward' ? openIndex : caretOffset;
    setElementTextAndCaret(element, nextText, nextCaretOffset);
    return true;
  }
}

function getBraceAutocompleteContext(element: HTMLElement): BraceAutocompleteContext | null {
  const caretOffset = getCaretOffsetInElement(element);
  if (caretOffset == null) {
    return null;
  }

  const fullText = element.textContent ?? '';
  const beforeCaret = fullText.slice(0, caretOffset);
  const openBraceIndex = beforeCaret.lastIndexOf('{');
  if (openBraceIndex === -1) {
    return null;
  }

  const betweenOpenAndCaret = beforeCaret.slice(openBraceIndex + 1);
  if (betweenOpenAndCaret.includes('}') || betweenOpenAndCaret.includes('\n')) {
    return null;
  }

  return {
    openBraceIndex,
    caretOffset,
    query: betweenOpenAndCaret,
  };
}

function getCaretViewportPosition(element: HTMLElement): CaretViewportPosition {
  const range = getSelectionRangeWithinElement(element);
  if (!range) {
    const rect = element.getBoundingClientRect();
    return { top: rect.bottom + 6, left: rect.left };
  }

  const collapsed = range.cloneRange();
  collapsed.collapse(true);
  const rect = collapsed.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    const fallbackRect = element.getBoundingClientRect();
    return { top: fallbackRect.bottom + 6, left: fallbackRect.left };
  }

  return {
    top: rect.bottom + 6,
    left: rect.left,
  };
}

function filterAutocompleteCandidates(
  candidates: EditableAutocompleteCandidate[],
  rawQuery: string
): EditableAutocompleteCandidate[] {
  const normalizedQuery = normalizeAutocompleteInput(rawQuery);
  if (!normalizedQuery) {
    return candidates.slice(0, MAX_AUTOCOMPLETE_ITEMS);
  }

  const scored = candidates
    .map((candidate) => {
      const normalizedLabel = normalizeAutocompleteInput(candidate.label);

      if (normalizedLabel.startsWith(normalizedQuery)) {
        return { candidate, score: 0 };
      }
      if (candidate.pinyin.startsWith(normalizedQuery)) {
        return { candidate, score: 1 };
      }
      if (candidate.pinyinInitials.startsWith(normalizedQuery)) {
        return { candidate, score: 2 };
      }
      if (normalizedLabel.includes(normalizedQuery)) {
        return { candidate, score: 3 };
      }
      if (candidate.pinyin.includes(normalizedQuery)) {
        return { candidate, score: 4 };
      }
      if (candidate.pinyinInitials.includes(normalizedQuery)) {
        return { candidate, score: 5 };
      }

      return null;
    })
    .filter((entry): entry is { candidate: EditableAutocompleteCandidate; score: number } =>
      Boolean(entry)
    )
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.candidate.label.localeCompare(b.candidate.label, 'zh-CN');
    });

  return scored.slice(0, MAX_AUTOCOMPLETE_ITEMS).map((entry) => entry.candidate);
}

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
  const [isImeComposing, setIsImeComposing] = useState(false);
  const [autocompleteCandidates, setAutocompleteCandidates] =
    useState<EditableAutocompleteCandidate[]>();
  const [autocompleteItems, setAutocompleteItems] = useState<EditableAutocompleteCandidate[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState<CaretViewportPosition>({
    top: 0,
    left: 0,
  });
  const autocompleteListRef = useRef<HTMLDivElement>(null);
  const autocompleteItemRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  useEffect(() => {
    let disposed = false;

    getEditableAutocompleteCandidates()
      .then((candidates) => {
        if (!disposed) {
          setAutocompleteCandidates(candidates);
        }
      })
      .catch((error) => {
        console.error('Failed to prepare editable autocomplete candidates:', error);
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    autocompleteItemRefs.current = [];
  }, [autocompleteItems]);

  useEffect(() => {
    if (!isAutocompleteOpen) {
      return;
    }

    const activeItem = autocompleteItemRefs.current[activeAutocompleteIndex];
    if (!activeItem || !autocompleteListRef.current) {
      return;
    }

    activeItem.scrollIntoView({ block: 'nearest' });
  }, [activeAutocompleteIndex, autocompleteItems, isAutocompleteOpen]);

  const getClampedAutocompletePosition = useCallback((): CaretViewportPosition | null => {
    if (!contentRef.current) {
      return null;
    }

    const caretPosition = getCaretViewportPosition(contentRef.current);
    const popupWidth = autocompleteListRef.current?.offsetWidth ?? AUTOCOMPLETE_FALLBACK_WIDTH;
    const maxLeft = Math.max(
      AUTOCOMPLETE_VIEWPORT_PADDING,
      window.innerWidth - popupWidth - AUTOCOMPLETE_VIEWPORT_PADDING
    );

    return {
      top: caretPosition.top,
      left: Math.min(Math.max(caretPosition.left, AUTOCOMPLETE_VIEWPORT_PADDING), maxLeft),
    };
  }, []);

  const syncAutocompletePosition = useCallback(() => {
    if (!isAutocompleteOpen) {
      return;
    }

    const nextPosition = getClampedAutocompletePosition();
    if (!nextPosition) {
      return;
    }

    setAutocompletePosition(nextPosition);
  }, [getClampedAutocompletePosition, isAutocompleteOpen]);

  useEffect(() => {
    if (!isAutocompleteOpen) {
      return;
    }

    let rafId = 0;
    const schedulePositionSync = () => {
      if (rafId !== 0) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        syncAutocompletePosition();
      });
    };

    window.addEventListener('scroll', schedulePositionSync, true);
    window.addEventListener('resize', schedulePositionSync);
    schedulePositionSync();

    return () => {
      window.removeEventListener('scroll', schedulePositionSync, true);
      window.removeEventListener('resize', schedulePositionSync);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isAutocompleteOpen, syncAutocompletePosition]);

  const closeAutocomplete = useCallback(() => {
    setIsAutocompleteOpen(false);
    setAutocompleteItems([]);
    setActiveAutocompleteIndex(0);
  }, []);

  const refreshAutocomplete = useCallback(() => {
    if (!contentRef.current || valueType !== 'string' || !isEditMode || !enableEdit) {
      closeAutocomplete();
      return;
    }

    if (!autocompleteCandidates || autocompleteCandidates.length === 0) {
      closeAutocomplete();
      return;
    }

    const context = getBraceAutocompleteContext(contentRef.current);
    if (!context) {
      closeAutocomplete();
      return;
    }

    const nextItems = filterAutocompleteCandidates(autocompleteCandidates, context.query);
    if (nextItems.length === 0) {
      closeAutocomplete();
      return;
    }

    setAutocompleteItems(nextItems);
    const nextPosition = getClampedAutocompletePosition();
    if (nextPosition) {
      setAutocompletePosition(nextPosition);
    }
    setIsAutocompleteOpen(true);
    setActiveAutocompleteIndex((prev) => Math.min(prev, nextItems.length - 1));
  }, [
    autocompleteCandidates,
    closeAutocomplete,
    enableEdit,
    getClampedAutocompletePosition,
    isEditMode,
    valueType,
  ]);

  const insertSnippetAtCaret = useCallback((snippet: string, cursorOffsetInSnippet: number) => {
    if (!contentRef.current) {
      return;
    }

    const currentText =
      contentRef.current.textContent === EMPTY_EDITABLE_PLACEHOLDER
        ? ''
        : (contentRef.current.textContent ?? '');
    const caretOffset = getCaretOffsetInElement(contentRef.current);
    if (caretOffset == null) {
      return;
    }

    const nextText =
      currentText.slice(0, caretOffset) + snippet + currentText.slice(Math.max(caretOffset, 0));
    const nextCaretOffset = caretOffset + cursorOffsetInSnippet;
    setElementTextAndCaret(contentRef.current, nextText, nextCaretOffset);
  }, []);

  const applyAutocompleteItem = useCallback(
    (candidate: EditableAutocompleteCandidate) => {
      if (!contentRef.current) {
        return;
      }

      const context = getBraceAutocompleteContext(contentRef.current);
      if (!context) {
        return;
      }

      const currentText =
        contentRef.current.textContent === EMPTY_EDITABLE_PLACEHOLDER
          ? ''
          : (contentRef.current.textContent ?? '');
      const beforeOpenBrace = currentText.slice(0, context.openBraceIndex + 1);
      const afterCaret = currentText.slice(context.caretOffset);
      const shouldAppendClosingBrace = !afterCaret.startsWith('}');
      const closingBrace = shouldAppendClosingBrace ? '}' : '';

      const nextText = `${beforeOpenBrace}${candidate.insertText}${closingBrace}${afterCaret}`;
      const nextCaretOffset = beforeOpenBrace.length + candidate.insertText.length + 1;

      setElementTextAndCaret(contentRef.current, nextText, nextCaretOffset);
      closeAutocomplete();
    },
    [closeAutocomplete]
  );

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
    closeAutocomplete();
  }, [closeAutocomplete, content, onSave, valueType, writeValue]);

  const handleInput = useCallback(() => {
    if (isImeComposing) {
      return;
    }

    refreshAutocomplete();
  }, [isImeComposing, refreshAutocomplete]);

  const handleCompositionStart = useCallback(() => {
    setIsImeComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsImeComposing(false);
    refreshAutocomplete();
  }, [refreshAutocomplete]);

  const handleClick = useCallback(() => {
    refreshAutocomplete();
  }, [refreshAutocomplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const isComposing = isImeComposing || e.nativeEvent.isComposing;

      if (isAutocompleteOpen && !isComposing) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveAutocompleteIndex((prev) =>
            autocompleteItems.length === 0 ? 0 : Math.min(prev + 1, autocompleteItems.length - 1)
          );
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveAutocompleteIndex((prev) => Math.max(prev - 1, 0));
          return;
        }

        if (e.key === 'Enter' || e.key === 'Tab') {
          const activeItem = autocompleteItems[activeAutocompleteIndex];
          if (activeItem) {
            e.preventDefault();
            applyAutocompleteItem(activeItem);
            return;
          }
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          closeAutocomplete();
          return;
        }
      }

      if (
        !isComposing &&
        valueType === 'string' &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        e.key === '{'
      ) {
        e.preventDefault();
        insertSnippetAtCaret('{}', 1);
        refreshAutocomplete();
        return;
      }

      if (
        !isComposing &&
        valueType === 'string' &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        e.key === '['
      ) {
        e.preventDefault();
        insertSnippetAtCaret('[]()', 1);
        closeAutocomplete();
        return;
      }

      if (!isComposing && valueType === 'string' && e.key === 'Backspace' && contentRef.current) {
        if (deletePairedBraceAtCaret(contentRef.current, 'backward')) {
          e.preventDefault();
          refreshAutocomplete();
          return;
        }
      }

      if (!isComposing && valueType === 'string' && e.key === 'Delete' && contentRef.current) {
        if (deletePairedBraceAtCaret(contentRef.current, 'forward')) {
          e.preventDefault();
          refreshAutocomplete();
          return;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeAutocomplete();
        contentRef.current?.blur();
      } else if (e.key === 'Enter' && isSingleLine) {
        e.preventDefault();
        contentRef.current?.blur();
      }
    },
    [
      activeAutocompleteIndex,
      applyAutocompleteItem,
      autocompleteItems,
      closeAutocomplete,
      insertSnippetAtCaret,
      isAutocompleteOpen,
      isImeComposing,
      isSingleLine,
      refreshAutocomplete,
      valueType,
    ]
  );

  const autocompleteOverlay = isAutocompleteOpen
    ? createPortal(
        <div
          ref={autocompleteListRef}
          className='z-120 max-h-64 min-w-0 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10'
          style={{
            position: 'fixed',
            top: autocompletePosition.top,
            left: autocompletePosition.left,
            minWidth: 'min(14rem, calc(100vw - 1rem))',
            maxWidth: 'calc(100vw - 1rem)',
          }}
        >
          {autocompleteItems.map((candidate, index) => {
            const isActive = index === activeAutocompleteIndex;
            return (
              <button
                key={`${candidate.source}-${candidate.label}`}
                ref={(node) => {
                  autocompleteItemRefs.current[index] = node;
                }}
                type='button'
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                  isActive
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyAutocompleteItem(candidate);
                }}
              >
                <span className='truncate'>{candidate.label}</span>
                <span className='text-muted-foreground ml-2 shrink-0 text-[11px]'>
                  {candidate.source}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return {
    isEditMode: isEditMode && enableEdit,
    content,
    setNodeRef,
    handleBlur,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    autocompleteOverlay,
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

  const {
    isEditMode,
    content,
    setNodeRef,
    handleBlur,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    autocompleteOverlay,
  } = useInlineEditableContent({
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
    return (
      <>
        {React.createElement(
          tag,
          {
            contentEditable: 'plaintext-only',
            suppressContentEditableWarning: true,
            onBlur: handleBlur,
            onInput: handleInput,
            onClick: handleClick,
            onCompositionStart: handleCompositionStart,
            onCompositionEnd: handleCompositionEnd,
            onKeyDown: handleKeyDown,
            ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
            ...(rest as React.ComponentPropsWithoutRef<TagName>),
          },
          String(content) || EMPTY_EDITABLE_PLACEHOLDER
        )}
        {autocompleteOverlay}
      </>
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

  const {
    isEditMode,
    content,
    setNodeRef,
    handleBlur,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    autocompleteOverlay,
  } = useInlineEditableContent({
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
    return (
      <>
        {React.createElement(
          tag,
          {
            contentEditable: 'plaintext-only',
            suppressContentEditableWarning: true,
            onBlur: handleBlur,
            onInput: handleInput,
            onClick: handleClick,
            onCompositionStart: handleCompositionStart,
            onCompositionEnd: handleCompositionEnd,
            onKeyDown: handleKeyDown,
            ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
            ...(rest as React.ComponentPropsWithoutRef<TagName>),
          },
          String(content) || EMPTY_EDITABLE_PLACEHOLDER
        )}
        {autocompleteOverlay}
      </>
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

  const {
    isEditMode,
    content,
    setNodeRef,
    handleBlur,
    handleInput,
    handleClick,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    autocompleteOverlay,
  } = useInlineEditableContent({
    initialValue,
    valueType,
    isSingleLine,
    onSave,
    enableEdit,
    readStoredValue,
    writeValue,
  });

  if (isEditMode) {
    return (
      <>
        {React.createElement(
          tag,
          {
            contentEditable: 'plaintext-only',
            suppressContentEditableWarning: true,
            onBlur: handleBlur,
            onInput: handleInput,
            onClick: handleClick,
            onCompositionStart: handleCompositionStart,
            onCompositionEnd: handleCompositionEnd,
            onKeyDown: handleKeyDown,
            ref: setNodeRef as unknown as React.Ref<HTMLElementTagNameMap[TagName]>,
            ...(rest as React.ComponentPropsWithoutRef<TagName>),
          },
          String(content) || EMPTY_EDITABLE_PLACEHOLDER
        )}
        {autocompleteOverlay}
      </>
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
