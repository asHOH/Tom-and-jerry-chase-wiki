export type DiffDisplayItem<Row> =
  { type: 'row'; row: Row; rowIndex: number } | { type: 'gap'; id: string; hiddenCount: number };

export function collapseDiffRows<Row extends { kind: string }>(
  rows: Row[],
  expandedGapIds: ReadonlySet<string>,
  contextLines = 3
): DiffDisplayItem<Row>[] {
  const items: DiffDisplayItem<Row>[] = [];
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
