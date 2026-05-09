type PairOpenBrace = '{' | '[';

export type CaretViewportPosition = {
  top: number;
  left: number;
};

export type BraceAutocompleteContext = {
  openBraceIndex: number;
  caretOffset: number;
  query: string;
};

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

export function getCaretOffsetInElement(element: HTMLElement): number | null {
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

export function setElementTextAndCaret(
  element: HTMLElement,
  nextText: string,
  caretOffset: number
): void {
  element.textContent = nextText;
  setCaretOffsetInElement(element, caretOffset);
}

function isPairOpenBrace(char: string): char is PairOpenBrace {
  return char === '{' || char === '[';
}

export function deletePairedBraceAtCaret(
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

export function getBraceAutocompleteContext(element: HTMLElement): BraceAutocompleteContext | null {
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

export function getCaretViewportPosition(element: HTMLElement): CaretViewportPosition {
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
