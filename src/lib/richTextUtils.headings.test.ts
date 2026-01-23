import { htmlToWikiText, normalizeHeadingLevels, wikiTextToHTML } from './richTextUtils';

describe('Heading conversions', () => {
  it('maps Wiki heading markers to the correct HTML levels', () => {
    const wiki = [
      '= Title =',
      '== Section ==',
      '=== Subsection ===',
      '==== Details ====',
      '===== Minor =====',
      '====== Tiny ======',
    ].join('\n');

    const html = wikiTextToHTML(wiki);

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<h2>Section</h2>');
    expect(html).toContain('<h3>Subsection</h3>');
    expect(html).toContain('<h4>Details</h4>');
    expect(html).toContain('<h5>Minor</h5>');
    expect(html).toContain('<h6>Tiny</h6>');
  });

  it('round-trips heading levels between HTML and WikiText without promotion', () => {
    const html = '<h2>Section</h2><h3>Subsection</h3><h4>Details</h4><h5>Minor</h5><h6>Tiny</h6>';

    const wiki = htmlToWikiText(html);
    const roundTrippedHtml = wikiTextToHTML(wiki);

    expect(wiki).toContain('== Section ==');
    expect(wiki).toContain('=== Subsection ===');
    expect(wiki).toContain('==== Details ====');
    expect(wiki).toContain('===== Minor =====');
    expect(wiki).toContain('====== Tiny ======');

    expect(roundTrippedHtml).toContain('<h2>Section</h2>');
    expect(roundTrippedHtml).toContain('<h3>Subsection</h3>');
    expect(roundTrippedHtml).toContain('<h4>Details</h4>');
    expect(roundTrippedHtml).toContain('<h5>Minor</h5>');
    expect(roundTrippedHtml).toContain('<h6>Tiny</h6>');
  });

  it('demotes headings when the minimum level is H1', () => {
    const html = '<h1>Main</h1><h2>Sub</h2><h4>Child</h4><p>Text</p>';

    const normalized = normalizeHeadingLevels(html);

    expect(normalized).toContain('<h2>Main</h2>');
    expect(normalized).toContain('<h3>Sub</h3>');
    expect(normalized).toContain('<h5>Child</h5>');
    expect(normalized).not.toMatch(/<h1/i);
  });
});
