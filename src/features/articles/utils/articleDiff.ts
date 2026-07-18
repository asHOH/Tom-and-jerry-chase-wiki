import { diffArrays, diffWords, type ChangeObject } from 'diff';

import { sanitizeHTML } from '@/lib/xssUtils';

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'figure',
  'figcaption',
  'footer',
  'header',
  'main',
  'nav',
  'section',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const DIFF_TIMEOUT_MS = 500;
const INLINE_DIFF_TIMEOUT_MS = 200;
const MAX_EDIT_LENGTH = 10_000;
const MAX_INLINE_EDIT_LENGTH = 2_000;

export type ArticleDiffSegment = {
  value: string;
  kind: 'unchanged' | 'added' | 'removed';
};

export type ArticleDiffRow = {
  kind: 'context' | 'changed' | 'added' | 'removed';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  oldText: string | null;
  newText: string | null;
  oldSegments: ArticleDiffSegment[];
  newSegments: ArticleDiffSegment[];
};

export type ArticleDiffResult = {
  rows: ArticleDiffRow[];
  identical: boolean;
  simplified: boolean;
};

export type ArticleDiffDisplayItem =
  | { type: 'row'; row: ArticleDiffRow; rowIndex: number }
  | { type: 'gap'; id: string; hiddenCount: number };

function normalizeInlineWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\f\v ]+/g, ' ')
    .trim();
}

function extractInlineText(node: Node, skippedTags: ReadonlySet<string> = new Set()): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  if (skippedTags.has(tagName)) return '';
  if (tagName === 'br') return '\n';

  if (tagName === 'img') {
    const alt = normalizeInlineWhitespace(element.getAttribute('alt') ?? '');
    return alt ? `[图片: ${alt}]` : '[图片]';
  }

  if (tagName === 'iframe') {
    const title = normalizeInlineWhitespace(element.getAttribute('title') ?? '');
    return title ? `[视频: ${title}]` : '[视频]';
  }

  return Array.from(element.childNodes)
    .map((child) => extractInlineText(child, skippedTags))
    .join('');
}

function appendNormalizedLines(lines: string[], value: string, prefix = ''): void {
  value.split(/\r?\n/).forEach((part) => {
    const normalized = normalizeInlineWhitespace(part);
    if (normalized) lines.push(`${prefix}${normalized}`);
  });
}

function isStructuralElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return (
    HEADING_TAGS.has(tagName) ||
    [
      'p',
      'pre',
      'li',
      'tr',
      'img',
      'iframe',
      'ul',
      'ol',
      'table',
      'thead',
      'tbody',
      'tfoot',
    ].includes(tagName) ||
    BLOCK_TAGS.has(tagName)
  );
}

function collectReadableLines(node: Node, lines: string[], listDepth = 0, quoteDepth = 0): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const quotePrefix = quoteDepth > 0 ? `${'›'.repeat(quoteDepth)} ` : '';

  if (HEADING_TAGS.has(tagName) || tagName === 'p' || tagName === 'figcaption') {
    appendNormalizedLines(lines, extractInlineText(element), quotePrefix);
    return;
  }

  if (tagName === 'pre') {
    appendNormalizedLines(lines, element.textContent ?? '', `${quotePrefix}  `);
    return;
  }

  if (tagName === 'li') {
    const ownText = extractInlineText(element, new Set(['ul', 'ol']));
    const marker = `${quotePrefix}${'  '.repeat(Math.max(0, listDepth - 1))}• `;
    appendNormalizedLines(lines, ownText, marker);
    Array.from(element.children)
      .filter((child) => ['ul', 'ol'].includes(child.tagName.toLowerCase()))
      .forEach((child) => collectReadableLines(child, lines, listDepth + 1, quoteDepth));
    return;
  }

  if (tagName === 'tr') {
    const cells = Array.from(element.children)
      .filter((child) => ['td', 'th'].includes(child.tagName.toLowerCase()))
      .map((cell) => normalizeInlineWhitespace(extractInlineText(cell)))
      .filter(Boolean);
    if (cells.length > 0) lines.push(`${quotePrefix}${cells.join(' | ')}`);
    return;
  }

  if (tagName === 'img' || tagName === 'iframe') {
    appendNormalizedLines(lines, extractInlineText(element), quotePrefix);
    return;
  }

  const nextListDepth = ['ul', 'ol'].includes(tagName) ? Math.max(1, listDepth) : listDepth;
  const nextQuoteDepth = tagName === 'blockquote' ? quoteDepth + 1 : quoteDepth;

  if (
    tagName === 'body' ||
    tagName === 'ul' ||
    tagName === 'ol' ||
    tagName === 'table' ||
    tagName === 'thead' ||
    tagName === 'tbody' ||
    tagName === 'tfoot' ||
    BLOCK_TAGS.has(tagName)
  ) {
    const childQuotePrefix = nextQuoteDepth > 0 ? `${'›'.repeat(nextQuoteDepth)} ` : '';
    const childElements = Array.from(element.children);
    if (!childElements.some(isStructuralElement)) {
      appendNormalizedLines(lines, extractInlineText(element), childQuotePrefix);
      return;
    }

    let inlineBuffer = '';
    const flushInlineBuffer = () => {
      appendNormalizedLines(lines, inlineBuffer, childQuotePrefix);
      inlineBuffer = '';
    };

    Array.from(element.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && isStructuralElement(child as Element)) {
        flushInlineBuffer();
        collectReadableLines(child, lines, nextListDepth, nextQuoteDepth);
      } else {
        inlineBuffer += extractInlineText(child);
      }
    });
    flushInlineBuffer();
  }
}

export function articleHtmlToReadableLines(content: string | null | undefined): string[] {
  if (!content) return [];

  const parsed = new DOMParser().parseFromString(sanitizeHTML(content), 'text/html');
  const lines: string[] = [];
  collectReadableLines(parsed.body, lines);
  return lines;
}

function unchangedSegments(value: string | null): ArticleDiffSegment[] {
  return value ? [{ value, kind: 'unchanged' }] : [];
}

function changedSegments(
  oldText: string,
  newText: string
): {
  oldSegments: ArticleDiffSegment[];
  newSegments: ArticleDiffSegment[];
} {
  const intlSegmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
  const changes = diffWords(oldText, newText, {
    intlSegmenter,
    maxEditLength: MAX_INLINE_EDIT_LENGTH,
    timeout: INLINE_DIFF_TIMEOUT_MS,
  });

  if (!changes) {
    return {
      oldSegments: [{ value: oldText, kind: 'removed' }],
      newSegments: [{ value: newText, kind: 'added' }],
    };
  }

  return {
    oldSegments: changes
      .filter((change) => !change.added)
      .map((change) => ({
        value: change.value,
        kind: change.removed ? 'removed' : 'unchanged',
      })),
    newSegments: changes
      .filter((change) => !change.removed)
      .map((change) => ({
        value: change.value,
        kind: change.added ? 'added' : 'unchanged',
      })),
  };
}

function buildRowsFromChanges(changes: ChangeObject<string[]>[]): ArticleDiffRow[] {
  const rows: ArticleDiffRow[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let removed: string[] = [];
  let added: string[] = [];

  const flushChangedRows = () => {
    const rowCount = Math.max(removed.length, added.length);
    for (let index = 0; index < rowCount; index += 1) {
      const oldText = removed[index] ?? null;
      const newText = added[index] ?? null;
      const inline =
        oldText !== null && newText !== null
          ? changedSegments(oldText, newText)
          : {
              oldSegments: oldText ? [{ value: oldText, kind: 'removed' as const }] : [],
              newSegments: newText ? [{ value: newText, kind: 'added' as const }] : [],
            };

      rows.push({
        kind: oldText === null ? 'added' : newText === null ? 'removed' : 'changed',
        oldLineNumber: oldText === null ? null : oldLineNumber++,
        newLineNumber: newText === null ? null : newLineNumber++,
        oldText,
        newText,
        ...inline,
      });
    }
    removed = [];
    added = [];
  };

  changes.forEach((change) => {
    if (change.removed) {
      removed.push(...change.value);
      return;
    }
    if (change.added) {
      added.push(...change.value);
      return;
    }

    flushChangedRows();
    change.value.forEach((text) => {
      rows.push({
        kind: 'context',
        oldLineNumber: oldLineNumber++,
        newLineNumber: newLineNumber++,
        oldText: text,
        newText: text,
        oldSegments: unchangedSegments(text),
        newSegments: unchangedSegments(text),
      });
    });
  });
  flushChangedRows();

  return rows;
}

function buildSimplifiedRows(oldLines: string[], newLines: string[]): ArticleDiffRow[] {
  const changes: ChangeObject<string[]>[] = [];
  if (oldLines.length > 0) {
    changes.push({ value: oldLines, added: false, removed: true, count: oldLines.length });
  }
  if (newLines.length > 0) {
    changes.push({ value: newLines, added: true, removed: false, count: newLines.length });
  }
  return buildRowsFromChanges(changes);
}

export function createArticleDiff(
  oldContent: string | null | undefined,
  newContent: string | null | undefined
): ArticleDiffResult {
  const oldLines = articleHtmlToReadableLines(oldContent);
  const newLines = articleHtmlToReadableLines(newContent);
  const identical =
    oldLines.length === newLines.length && oldLines.every((line, i) => line === newLines[i]);

  if (identical) {
    return {
      rows: oldLines.map((text, index) => ({
        kind: 'context',
        oldLineNumber: index + 1,
        newLineNumber: index + 1,
        oldText: text,
        newText: text,
        oldSegments: unchangedSegments(text),
        newSegments: unchangedSegments(text),
      })),
      identical: true,
      simplified: false,
    };
  }

  const changes = diffArrays(oldLines, newLines, {
    maxEditLength: MAX_EDIT_LENGTH,
    timeout: DIFF_TIMEOUT_MS,
  });

  return changes
    ? { rows: buildRowsFromChanges(changes), identical: false, simplified: false }
    : { rows: buildSimplifiedRows(oldLines, newLines), identical: false, simplified: true };
}

export function collapseArticleDiffRows(
  rows: ArticleDiffRow[],
  expandedGapIds: ReadonlySet<string>,
  contextLines = 3
): ArticleDiffDisplayItem[] {
  const items: ArticleDiffDisplayItem[] = [];
  let index = 0;

  while (index < rows.length) {
    if (rows[index]?.kind !== 'context') {
      items.push({ type: 'row', row: rows[index]!, rowIndex: index });
      index += 1;
      continue;
    }

    const runStart = index;
    while (index < rows.length && rows[index]?.kind === 'context') index += 1;
    const runEnd = index;
    const runLength = runEnd - runStart;
    const visibleContextLimit =
      runStart === 0 || runEnd === rows.length ? contextLines : contextLines * 2;

    if (runLength <= visibleContextLimit) {
      for (let rowIndex = runStart; rowIndex < runEnd; rowIndex += 1) {
        items.push({ type: 'row', row: rows[rowIndex]!, rowIndex });
      }
      continue;
    }

    const keepBefore = runStart === 0 ? 0 : Math.min(contextLines, runEnd - runStart);
    const keepAfter = runEnd === rows.length ? 0 : Math.min(contextLines, runEnd - runStart);
    const hiddenStart = runStart + keepBefore;
    const hiddenEnd = runEnd - keepAfter;
    const gapId = `${hiddenStart}-${hiddenEnd}`;

    for (let rowIndex = runStart; rowIndex < hiddenStart; rowIndex += 1) {
      items.push({ type: 'row', row: rows[rowIndex]!, rowIndex });
    }

    if (hiddenEnd > hiddenStart && !expandedGapIds.has(gapId)) {
      items.push({ type: 'gap', id: gapId, hiddenCount: hiddenEnd - hiddenStart });
    } else {
      for (let rowIndex = hiddenStart; rowIndex < hiddenEnd; rowIndex += 1) {
        items.push({ type: 'row', row: rows[rowIndex]!, rowIndex });
      }
    }

    for (let rowIndex = hiddenEnd; rowIndex < runEnd; rowIndex += 1) {
      items.push({ type: 'row', row: rows[rowIndex]!, rowIndex });
    }
  }

  return items;
}
