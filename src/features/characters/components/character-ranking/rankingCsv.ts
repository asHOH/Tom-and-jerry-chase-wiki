/** Serialize the displayed table with UTF-8 BOM for spreadsheet compatibility. */
export function toRankingCsv(rows: readonly (readonly string[])[]): string {
  return `\uFEFF${rows
    .map((row) =>
      row
        .map((value) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value))
        .join(',')
    )
    .join('\r\n')}`;
}
