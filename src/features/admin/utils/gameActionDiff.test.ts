import { collapseGameActionSplitRows, createGameActionDiff } from './gameActionDiff';

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
