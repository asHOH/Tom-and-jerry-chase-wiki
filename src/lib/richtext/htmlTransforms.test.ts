import { cleanHTMLForExport, normalizeEditorHtml } from './htmlTransforms';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET: 'article-media',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  },
}));

const editorHtml =
  '<p class="lead" style="color:red;text-align:center">Body</p>' +
  '<table style="width:100%"><tr><td><p>Cell</p></td></tr></table>' +
  '<img src="/images/local.png" onerror="alert(1)">' +
  '<img src="https://project.supabase.co/storage/v1/object/public/article-media/hosted.png">' +
  '<img src="https://example.com/blocked.png">';

describe('normalizeEditorHtml', () => {
  it('preserves full content and alignment while applying image, style and class policies', () => {
    const output = normalizeEditorHtml(editorHtml);

    expect(output).toContain('<p class="rte-text-center">Body</p>');
    expect(output).toContain('<table><tr><td><p>Cell</p></td></tr></table>');
    expect(output).toContain('<img src="/images/local.png" alt="">');
    expect(output).toContain('article-media/hosted.png');
    expect(output).not.toMatch(/style=|lead|onerror|blocked/);
    expect(normalizeEditorHtml(output)).toBe(output);
  });

  it('applies the notice policy after converting alignment to allowed classes', () => {
    const output = normalizeEditorHtml(editorHtml, 'notice');

    expect(output).toBe('<p class="rte-text-center">Body</p><p>Cell</p>');
    expect(normalizeEditorHtml(output, 'notice')).toBe(output);
    expect(cleanHTMLForExport(editorHtml, 'notice')).toBe(output);
  });

  it('keeps existing alignment classes without duplicating them', () => {
    expect(
      normalizeEditorHtml('<p class="rte-text-center" style="text-align: center;">基础信息</p>')
    ).toBe('<p class="rte-text-center">基础信息</p>');
  });
});

describe('cleanHTMLForExport', () => {
  it('removes colgroup and inline styles on table', () => {
    const input =
      '<table style="min-width:600px"><colgroup><col style="width:50%"/></colgroup><tr><td>a</td></tr></table>';
    const out = cleanHTMLForExport(input);
    expect(out).not.toMatch(/colgroup/);
    expect(out).toMatch(/<table>/);
  });

  it('removes inline styles from article content', () => {
    const input =
      '<h2 style="text-align: left;">玩法说明</h2><p style="text-align: center;">基础信息</p>';
    const out = cleanHTMLForExport(input);

    expect(out).toBe(
      '<h2 class="rte-text-left">玩法说明</h2><p class="rte-text-center">基础信息</p>'
    );
    expect(out).not.toContain('style=');
  });

  it('converts text alignment styles to classes before removing styles', () => {
    const input =
      '<h2 style="text-align: left;">玩法说明</h2><p style="color:red;text-align: center;">基础信息</p><p class="lead" style="text-align: right;">结论</p>';
    const out = cleanHTMLForExport(input);

    expect(out).toBe(
      '<h2 class="rte-text-left">玩法说明</h2><p class="rte-text-center">基础信息</p><p class="rte-text-right">结论</p>'
    );
    expect(out).not.toContain('style=');
    expect(out).not.toContain('lead');
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
