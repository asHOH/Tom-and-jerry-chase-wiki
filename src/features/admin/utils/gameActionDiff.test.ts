import { applyPatch, parsePatch, reversePatch } from 'diff';

import {
  collapseGameActionSplitRows,
  createGameActionDiff,
  createGameActionUnifiedHunks,
  formatGameActionUnifiedDiff,
} from './gameActionDiff';

describe('game action unified diff export', () => {
  it.each([
    ['whole-value addition', undefined, { value: 'new' }],
    ['whole-value deletion', { value: 'old' }, undefined],
    ['final-line replacement', 'old', 'new'],
    ['final context line', { value: 'old' }, { value: 'new' }],
    [
      'multiple hunks',
      Array.from({ length: 20 }, (_, index) => index),
      Array.from({ length: 20 }, (_, index) => (index === 1 || index === 18 ? -index : index)),
    ],
  ])('preserves exact text in both directions for %s', (_name, before, after) => {
    const model = createGameActionDiff(before, after);
    for (const showAllContext of [false, true]) {
      const patch = formatGameActionUnifiedDiff(model, 'characters/example', showAllContext);
      expect(patch.endsWith('\n')).toBe(true);
      expect(applyPatch(model.oldText, patch)).toBe(model.newText);
      const [parsed] = parsePatch(patch);
      expect(applyPatch(model.newText, reversePatch(parsed!))).toBe(model.oldText);
    }
  });

  it('does not export a patch for identical values', () => {
    expect(formatGameActionUnifiedDiff(createGameActionDiff('same', 'same'), 'value', false)).toBe(
      ''
    );
  });
});

describe('game action unified diff context', () => {
  const before = Array.from({ length: 20 }, (_, index) => `line ${index}`);
  const after = before.map((line, index) => (index === 10 ? 'edited' : line));

  it('includes three context lines on each side and preserves the patch', () => {
    const model = createGameActionDiff(before, after);
    const hunks = createGameActionUnifiedHunks(model, false);
    expect(hunks).toHaveLength(1);
    expect(hunks[0]!.lines.filter((line) => line.kind === 'context')).toHaveLength(6);
    expect(applyPatch(model.oldText, formatGameActionUnifiedDiff(model, 'skills', false))).toBe(
      model.newText
    );
  });

  it('shows every original and updated line when full context is requested', () => {
    const model = createGameActionDiff(before, after);
    const [hunk] = createGameActionUnifiedHunks(model, true);
    expect(
      hunk!.lines
        .filter((line) => line.kind !== 'added')
        .map((line) => line.text)
        .join('\n')
    ).toBe(model.oldText);
    expect(
      hunk!.lines
        .filter((line) => line.kind !== 'removed')
        .map((line) => line.text)
        .join('\n')
    ).toBe(model.newText);
  });

  it('omits all context when zero context is requested', () => {
    const [hunk] = createGameActionUnifiedHunks(createGameActionDiff(before, after), false, 0);
    expect(hunk!.lines.map((line) => line.kind)).toEqual(['removed', 'added']);
  });
});

describe('game action split diff context', () => {
  it('renders a short unchanged run between changes only once', () => {
    const { splitRows } = createGameActionDiff(
      { a: 1, b: 'unchanged', c: 1 },
      { a: 2, b: 'unchanged', c: 2 }
    );

    expect(collapseGameActionSplitRows(splitRows, new Set(), false)).toEqual(
      splitRows.map((row, rowIndex) => ({ type: 'row', row, rowIndex }))
    );
  });

  it('collapses long context and restores every row when expanded or shown in full', () => {
    const unchanged = Array.from({ length: 12 }, (_, index) => `unchanged ${index}`);
    const { splitRows } = createGameActionDiff(
      ['old start', ...unchanged, 'old end'],
      ['new start', ...unchanged, 'new end']
    );
    const collapsed = collapseGameActionSplitRows(splitRows, new Set(), false);
    const gaps = collapsed.filter((item) => item.type === 'gap');

    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.hiddenCount).toBe(6);

    const allRows = splitRows.map((row, rowIndex) => ({ type: 'row', row, rowIndex }));
    expect(
      collapseGameActionSplitRows(splitRows, new Set(gaps.map((gap) => gap.id)), false)
    ).toEqual(allRows);
    expect(collapseGameActionSplitRows(splitRows, new Set(), true)).toEqual(allRows);
  });
});
