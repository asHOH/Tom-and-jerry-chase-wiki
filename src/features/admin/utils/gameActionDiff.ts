import { diffLines, diffWords, type ChangeObject } from 'diff';

const LINE_DIFF_TIMEOUT_MS = 500;
const INLINE_DIFF_TIMEOUT_MS = 200;
const MAX_LINE_EDIT_LENGTH = 10_000;
const MAX_INLINE_EDIT_LENGTH = 2_000;
const DEFAULT_CONTEXT_LINES = 3;

export type GameActionDiffView = 'unified' | 'normal' | 'split';

export type GameActionDiffSegment = {
  value: string;
  kind: 'unchanged' | 'added' | 'removed';
};

export type GameActionDiffValueLine = {
  text: string;
  lineNumber: number;
  segments: GameActionDiffSegment[];
};

type GameActionDiffContextLine = {
  text: string;
  oldLineNumber: number;
  newLineNumber: number;
};

type GameActionDiffContextChunk = {
  kind: 'context';
  lines: GameActionDiffContextLine[];
};

export type GameActionDiffChangeChunk = {
  kind: 'change';
  oldStart: number;
  newStart: number;
  oldLines: GameActionDiffValueLine[];
  newLines: GameActionDiffValueLine[];
};

type GameActionDiffChunk = GameActionDiffContextChunk | GameActionDiffChangeChunk;

export type GameActionSplitRow = {
  kind: 'context' | 'changed' | 'added' | 'removed';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  oldText: string | null;
  newText: string | null;
  oldSegments: GameActionDiffSegment[];
  newSegments: GameActionDiffSegment[];
};

export type GameActionSplitDisplayItem =
  | { type: 'row'; row: GameActionSplitRow; rowIndex: number }
  | { type: 'gap'; id: string; hiddenCount: number };

export type GameActionUnifiedLine = {
  kind: 'context' | 'added' | 'removed';
  text: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  segments: GameActionDiffSegment[];
};

export type GameActionUnifiedHunk = {
  header: string;
  lines: GameActionUnifiedLine[];
};

export type GameActionNormalGroup = {
  command: string;
  oldLines: GameActionDiffValueLine[];
  newLines: GameActionDiffValueLine[];
};

export type GameActionDiffModel = {
  oldText: string;
  newText: string;
  splitRows: GameActionSplitRow[];
  normalGroups: GameActionNormalGroup[];
  addedLines: number;
  removedLines: number;
  identical: boolean;
  simplified: boolean;
  chunks: GameActionDiffChunk[];
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (!isPlainRecord(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => [key, normalizeJsonValue(value[key])])
  );
}

export function formatGameActionDiffValue(value: unknown): string {
  if (value === undefined) return '';
  return JSON.stringify(normalizeJsonValue(value), null, 2) ?? String(value);
}

function splitLines(value: string): string[] {
  if (!value) return [];
  const lines = value.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

function unchangedSegments(value: string): GameActionDiffSegment[] {
  return value ? [{ value, kind: 'unchanged' }] : [];
}

function changedSegments(
  oldText: string,
  newText: string
): {
  oldSegments: GameActionDiffSegment[];
  newSegments: GameActionDiffSegment[];
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

function createChangeChunk(
  oldTexts: string[],
  newTexts: string[],
  oldStart: number,
  newStart: number,
  includeInlineChanges: boolean
): GameActionDiffChangeChunk {
  const oldLines: GameActionDiffValueLine[] = oldTexts.map((text, index) => ({
    text,
    lineNumber: oldStart + index,
    segments: text ? [{ value: text, kind: 'removed' }] : [],
  }));
  const newLines: GameActionDiffValueLine[] = newTexts.map((text, index) => ({
    text,
    lineNumber: newStart + index,
    segments: text ? [{ value: text, kind: 'added' }] : [],
  }));

  if (includeInlineChanges) {
    const pairedLineCount = Math.min(oldLines.length, newLines.length);
    for (let index = 0; index < pairedLineCount; index += 1) {
      const oldLine = oldLines[index]!;
      const newLine = newLines[index]!;
      const segments = changedSegments(oldLine.text, newLine.text);
      oldLine.segments = segments.oldSegments;
      newLine.segments = segments.newSegments;
    }
  }

  return {
    kind: 'change',
    oldStart,
    newStart,
    oldLines,
    newLines,
  };
}

function buildChunks(changes: ChangeObject<string>[]): GameActionDiffChunk[] {
  const chunks: GameActionDiffChunk[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let removed: string[] = [];
  let added: string[] = [];
  let changeOldStart = 1;
  let changeNewStart = 1;

  const flushChange = () => {
    if (removed.length === 0 && added.length === 0) return;
    chunks.push(createChangeChunk(removed, added, changeOldStart, changeNewStart, true));
    removed = [];
    added = [];
  };

  for (const change of changes) {
    const lines = splitLines(change.value);

    if (change.removed) {
      if (removed.length === 0 && added.length === 0) {
        changeOldStart = oldLineNumber;
        changeNewStart = newLineNumber;
      }
      removed.push(...lines);
      oldLineNumber += lines.length;
      continue;
    }

    if (change.added) {
      if (removed.length === 0 && added.length === 0) {
        changeOldStart = oldLineNumber;
        changeNewStart = newLineNumber;
      }
      added.push(...lines);
      newLineNumber += lines.length;
      continue;
    }

    flushChange();
    const contextLines = lines.map((text) => ({
      text,
      oldLineNumber: oldLineNumber++,
      newLineNumber: newLineNumber++,
    }));
    if (contextLines.length > 0) chunks.push({ kind: 'context', lines: contextLines });
  }

  flushChange();
  return chunks;
}

function buildSimplifiedChunks(oldText: string, newText: string): GameActionDiffChunk[] {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  if (oldLines.length === 0 && newLines.length === 0) return [];
  return [createChangeChunk(oldLines, newLines, 1, 1, false)];
}

function buildSplitRows(chunks: GameActionDiffChunk[]): GameActionSplitRow[] {
  return chunks.flatMap((chunk): GameActionSplitRow[] => {
    if (chunk.kind === 'context') {
      return chunk.lines.map((line) => ({
        kind: 'context',
        oldLineNumber: line.oldLineNumber,
        newLineNumber: line.newLineNumber,
        oldText: line.text,
        newText: line.text,
        oldSegments: unchangedSegments(line.text),
        newSegments: unchangedSegments(line.text),
      }));
    }

    const rowCount = Math.max(chunk.oldLines.length, chunk.newLines.length);
    return Array.from({ length: rowCount }, (_, index) => {
      const oldLine = chunk.oldLines[index] ?? null;
      const newLine = chunk.newLines[index] ?? null;
      return {
        kind: oldLine === null ? 'added' : newLine === null ? 'removed' : 'changed',
        oldLineNumber: oldLine?.lineNumber ?? null,
        newLineNumber: newLine?.lineNumber ?? null,
        oldText: oldLine?.text ?? null,
        newText: newLine?.text ?? null,
        oldSegments: oldLine?.segments ?? [],
        newSegments: newLine?.segments ?? [],
      };
    });
  });
}

function formatRange(start: number, count: number): string {
  return count <= 1 ? String(start) : `${start},${start + count - 1}`;
}

function buildNormalGroups(chunks: GameActionDiffChunk[]): GameActionNormalGroup[] {
  return chunks.flatMap((chunk) => {
    if (chunk.kind === 'context') return [];

    const oldCount = chunk.oldLines.length;
    const newCount = chunk.newLines.length;
    const command =
      oldCount === 0
        ? `${Math.max(0, chunk.oldStart - 1)}a${formatRange(chunk.newStart, newCount)}`
        : newCount === 0
          ? `${formatRange(chunk.oldStart, oldCount)}d${Math.max(0, chunk.newStart - 1)}`
          : `${formatRange(chunk.oldStart, oldCount)}c${formatRange(chunk.newStart, newCount)}`;

    return [
      {
        command,
        oldLines: chunk.oldLines,
        newLines: chunk.newLines,
      },
    ];
  });
}

export function createGameActionDiff(oldValue: unknown, newValue: unknown): GameActionDiffModel {
  const oldText = formatGameActionDiffValue(oldValue);
  const newText = formatGameActionDiffValue(newValue);
  const identical = oldText === newText;
  let simplified = false;
  let chunks: GameActionDiffChunk[] = [];

  if (identical) {
    const lines = splitLines(oldText).map((text, index) => ({
      text,
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
    }));
    if (lines.length > 0) chunks = [{ kind: 'context', lines }];
  } else {
    const changes = diffLines(oldText, newText, {
      maxEditLength: MAX_LINE_EDIT_LENGTH,
      oneChangePerToken: true,
      timeout: LINE_DIFF_TIMEOUT_MS,
    });

    if (changes) {
      chunks = buildChunks(changes);
    } else {
      chunks = buildSimplifiedChunks(oldText, newText);
      simplified = true;
    }
  }

  const changeChunks = chunks.filter(
    (chunk): chunk is GameActionDiffChangeChunk => chunk.kind === 'change'
  );

  return {
    oldText,
    newText,
    splitRows: buildSplitRows(chunks),
    normalGroups: buildNormalGroups(chunks),
    addedLines: changeChunks.reduce((total, chunk) => total + chunk.newLines.length, 0),
    removedLines: changeChunks.reduce((total, chunk) => total + chunk.oldLines.length, 0),
    identical,
    simplified,
    chunks,
  };
}

export function collapseGameActionSplitRows(
  rows: GameActionSplitRow[],
  expandedGapIds: ReadonlySet<string>,
  showAllContext: boolean,
  contextLines = DEFAULT_CONTEXT_LINES
): GameActionSplitDisplayItem[] {
  if (showAllContext) {
    return rows.map((row, rowIndex) => ({ type: 'row', row, rowIndex }));
  }

  const items: GameActionSplitDisplayItem[] = [];
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
    const keepBefore = runStart === 0 ? 0 : Math.min(contextLines, runEnd - runStart);
    const keepAfter = runEnd === rows.length ? 0 : Math.min(contextLines, runEnd - runStart);
    const hiddenStart = runStart + keepBefore;
    const hiddenEnd = runEnd - keepAfter;

    for (let rowIndex = runStart; rowIndex < hiddenStart; rowIndex += 1) {
      items.push({ type: 'row', row: rows[rowIndex]!, rowIndex });
    }

    const gapId = `${hiddenStart}-${hiddenEnd}`;
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

function contextLineToUnified(line: GameActionDiffContextLine): GameActionUnifiedLine {
  return {
    kind: 'context',
    text: line.text,
    oldLineNumber: line.oldLineNumber,
    newLineNumber: line.newLineNumber,
    segments: unchangedSegments(line.text),
  };
}

function changeChunkToUnified(chunk: GameActionDiffChangeChunk): GameActionUnifiedLine[] {
  return [
    ...chunk.oldLines.map((line) => ({
      kind: 'removed' as const,
      text: line.text,
      oldLineNumber: line.lineNumber,
      newLineNumber: null,
      segments: line.segments,
    })),
    ...chunk.newLines.map((line) => ({
      kind: 'added' as const,
      text: line.text,
      oldLineNumber: null,
      newLineNumber: line.lineNumber,
      segments: line.segments,
    })),
  ];
}

function formatUnifiedCoordinate(start: number, count: number): string {
  if (count === 1) return String(start);
  return `${start},${count}`;
}

export function createGameActionUnifiedHunks(
  model: GameActionDiffModel,
  showAllContext: boolean,
  contextLines = DEFAULT_CONTEXT_LINES
): GameActionUnifiedHunk[] {
  const changeIndexes = model.chunks.flatMap((chunk, index) =>
    chunk.kind === 'change' ? [index] : []
  );
  if (changeIndexes.length === 0) return [];

  const groups: Array<{ first: number; last: number }> = [];
  for (const changeIndex of changeIndexes) {
    const previous = groups.at(-1);
    if (!previous) {
      groups.push({ first: changeIndex, last: changeIndex });
      continue;
    }

    const interveningContextLines = model.chunks
      .slice(previous.last + 1, changeIndex)
      .reduce((total, chunk) => total + (chunk.kind === 'context' ? chunk.lines.length : 0), 0);

    if (showAllContext || interveningContextLines <= contextLines * 2) {
      previous.last = changeIndex;
    } else {
      groups.push({ first: changeIndex, last: changeIndex });
    }
  }

  return groups.map(({ first, last }) => {
    const firstChange = model.chunks[first] as GameActionDiffChangeChunk;
    const beforeChunk = model.chunks[first - 1];
    const afterChunk = model.chunks[last + 1];
    const beforeLines =
      beforeChunk?.kind === 'context'
        ? showAllContext
          ? beforeChunk.lines
          : beforeChunk.lines.slice(-contextLines)
        : [];
    const afterLines =
      afterChunk?.kind === 'context'
        ? showAllContext
          ? afterChunk.lines
          : afterChunk.lines.slice(0, contextLines)
        : [];
    const lines: GameActionUnifiedLine[] = beforeLines.map(contextLineToUnified);

    for (let index = first; index <= last; index += 1) {
      const chunk = model.chunks[index]!;
      if (chunk.kind === 'context') {
        lines.push(...chunk.lines.map(contextLineToUnified));
      } else {
        lines.push(...changeChunkToUnified(chunk));
      }
    }
    lines.push(...afterLines.map(contextLineToUnified));

    const oldLineCount = lines.filter((line) => line.oldLineNumber !== null).length;
    const newLineCount = lines.filter((line) => line.newLineNumber !== null).length;
    const firstOldLine = lines.find((line) => line.oldLineNumber !== null)?.oldLineNumber;
    const firstNewLine = lines.find((line) => line.newLineNumber !== null)?.newLineNumber;
    const oldStart = firstOldLine ?? Math.max(0, firstChange.oldStart - 1);
    const newStart = firstNewLine ?? Math.max(0, firstChange.newStart - 1);

    return {
      header: `@@ -${formatUnifiedCoordinate(oldStart, oldLineCount)} +${formatUnifiedCoordinate(newStart, newLineCount)} @@`,
      lines,
    };
  });
}

function safeVirtualFileName(fileName: string): string {
  return fileName.replace(/[\r\n\t]/g, ' ');
}

export function formatGameActionUnifiedDiff(
  model: GameActionDiffModel,
  fileName: string,
  showAllContext: boolean
): string {
  if (model.identical) return '';
  const safeName = safeVirtualFileName(fileName);
  const hunks = createGameActionUnifiedHunks(model, showAllContext);
  const lines = [`--- ${safeName}.old.json`, `+++ ${safeName}.new.json`];

  for (const hunk of hunks) {
    lines.push(hunk.header);
    for (const line of hunk.lines) {
      const prefix = line.kind === 'removed' ? '-' : line.kind === 'added' ? '+' : ' ';
      lines.push(`${prefix}${line.text}`);
    }
  }

  return lines.join('\n');
}

export function formatGameActionNormalDiff(model: GameActionDiffModel): string {
  if (model.identical) return '';
  const lines: string[] = [];

  for (const group of model.normalGroups) {
    lines.push(group.command);
    lines.push(...group.oldLines.map((line) => `< ${line.text}`));
    if (group.oldLines.length > 0 && group.newLines.length > 0) lines.push('---');
    lines.push(...group.newLines.map((line) => `> ${line.text}`));
  }

  return lines.join('\n');
}
