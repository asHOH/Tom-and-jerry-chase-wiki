import { Node as PMNode } from '@tiptap/pm/model';
import { Editor } from '@tiptap/react';

export function transposeTable(editor: Editor | null) {
  if (!editor) return;
  const { state, view } = editor;
  const { $from } = state.selection;
  let tableDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    const n = $from.node(d);
    if (n && n.type && n.type.name === 'table') {
      tableDepth = d;
      break;
    }
  }
  if (tableDepth === -1) return;
  const tableNode = $from.node(tableDepth) as PMNode;
  const startPos = $from.before(tableDepth);
  const endPos = $from.after(tableDepth);
  const rows: PMNode[][] = [];
  let maxCols = 0;
  let hasSpan = false;
  tableNode.forEach((row: PMNode) => {
    if (row.type.name !== 'tableRow') return;
    const cells: PMNode[] = [];
    row.forEach((cell: PMNode) => {
      const name = cell.type.name;
      if (name !== 'tableCell' && name !== 'tableHeader') return;
      const colspanVal = (cell.attrs && (cell.attrs as Record<string, unknown>)['colspan']) as
        | number
        | undefined;
      const rowspanVal = (cell.attrs && (cell.attrs as Record<string, unknown>)['rowspan']) as
        | number
        | undefined;
      const colspan = typeof colspanVal === 'number' ? colspanVal : 1;
      const rowspan = typeof rowspanVal === 'number' ? rowspanVal : 1;
      if (colspan > 1 || rowspan > 1) {
        hasSpan = true;
      }
      cells.push(cell);
    });
    maxCols = Math.max(maxCols, cells.length);
    rows.push(cells);
  });
  if (hasSpan) {
    window.alert('暂不支持包含合并单元格的表格进行转置');
    return;
  }
  const schema = state.schema;
  const tableRowType = schema.nodes.tableRow!;
  const tableCellType = schema.nodes.tableCell!;
  const tableHeaderType = schema.nodes.tableHeader!;
  const paragraphType = schema.nodes.paragraph!;
  if (!tableRowType || !tableCellType || !tableHeaderType || !paragraphType) {
    window.alert('转置失败：编辑器表格节点类型不可用');
    return;
  }
  const hasHeaderRow =
    rows.length > 0 &&
    rows[0] &&
    rows[0]!.length > 0 &&
    rows[0]!.every((c) => c && c.type === tableHeaderType);
  const hasHeaderCol = rows.length > 0 && rows.every((r) => r[0] && r[0]!.type === tableHeaderType);
  const makeCellLike = (source: PMNode | undefined, forceHeader: boolean): PMNode => {
    if (!source) {
      const filled = tableCellType.createAndFill();
      return filled ?? tableCellType.create({}, paragraphType.create());
    }
    if (forceHeader || source.type === tableHeaderType) {
      return tableHeaderType.create(source.attrs ?? {}, source.content);
    }
    return tableCellType.create(source.attrs ?? {}, source.content);
  };
  const newRowNodes: PMNode[] = [];
  for (let c = 0; c < maxCols; c++) {
    const newCells: PMNode[] = [];
    for (let r = 0; r < rows.length; r++) {
      const sourceCell = rows[r]?.[c];
      const forceHeader = c === 0 && (hasHeaderRow || hasHeaderCol);
      newCells.push(makeCellLike(sourceCell, forceHeader));
    }
    const rowNode = tableRowType.create({}, newCells);
    newRowNodes.push(rowNode);
  }
  const newTable = tableNode.type.create(tableNode.attrs ?? {}, newRowNodes);
  const tr = state.tr.replaceWith(startPos, endPos, newTable);
  view.dispatch(tr.scrollIntoView());
}
