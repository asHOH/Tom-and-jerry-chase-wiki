import { cleanHTMLForExport } from '@/lib/richtext/htmlTransforms';

describe('cleanHTMLForExport', () => {
  it('removes colgroup and inline styles on table', () => {
    const input =
      '<table style="min-width:600px"><colgroup><col style="width:50%"/></colgroup><tr><td>a</td></tr></table>';
    const out = cleanHTMLForExport(input);
    expect(out).not.toMatch(/colgroup/);
    expect(out).toMatch(/<table>/);
  });

  it('unwraps p tags inside table cells', () => {
    const input = '<table><tr><td><p>cell</p></td><th><p>head</p></th></tr></table>';
    const out = cleanHTMLForExport(input);
    expect(out).toMatch(/<td>\n?cell<\/td>/);
    expect(out).toMatch(/<th>\n?head<\/th>/);
  });

  it('removes empty paragraphs around table', () => {
    const input = '<p></p><table><tr><td>a</td></tr></table><p> </p>';
    const out = cleanHTMLForExport(input);
    expect(out.startsWith('<table')).toBe(true);
    expect(out.endsWith('</table>')).toBe(true);
  });

  it('removes default colspan/rowspan=1', () => {
    const input = '<table><tr><td colspan="1" rowspan="1">a</td></tr></table>';
    const out = cleanHTMLForExport(input);
    expect(out).toContain('<td>');
    expect(out).not.toContain('colspan="1"');
    expect(out).not.toContain('rowspan="1"');
  });

  it('removes tbody wrapper', () => {
    const input = '<table><tbody><tr><td>a</td></tr></tbody></table>';
    const out = cleanHTMLForExport(input);
    expect(out).toContain('<tr>');
    expect(out).not.toContain('<tbody>');
  });

  it('pretty prints with newlines around rows and cells', () => {
    const input = '<table><tr><td>a</td><td>b</td></tr></table>';
    const out = cleanHTMLForExport(input);
    // newlines before <tr>, between cells, and before closing tags
    expect(out).toMatch(/\n<tr>/);
    expect(out).toMatch(/\n<td>a<\/td>\n/);
    expect(out).toMatch(/\n<td>b<\/td>\n/);
    expect(out).toMatch(/\n<\/tr>/);
  });

  it('removes images from disallowed origins', () => {
    const input =
      '<p>ok</p><img src="https://example.com/image.png" onerror="alert(1)" /><img src="/images/local.png" data-test="stay" />';
    const out = cleanHTMLForExport(input);
    expect(out).not.toContain('https://example.com/image.png');
    expect(out).not.toContain('onerror');
    expect(out).toContain('/images/local.png');
  });
});
