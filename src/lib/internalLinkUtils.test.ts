import { getInternalLinkHref } from './internalLinkUtils';

describe('getInternalLinkHref', () => {
  const siteOrigin = 'https://www.tjwiki.com';

  it('keeps root-relative links and their query/hash', () => {
    expect(getInternalLinkHref('/articles/example/?from=wiki#details', siteOrigin)).toBe(
      '/articles/example/?from=wiki#details'
    );
  });

  it('converts same-origin absolute links to app paths', () => {
    expect(
      getInternalLinkHref('https://www.tjwiki.com/articles/example/?from=wiki#details', siteOrigin)
    ).toBe('/articles/example/?from=wiki#details');
  });

  it('does not classify other origins or protocol-relative links as internal', () => {
    expect(getInternalLinkHref('https://example.com/articles', siteOrigin)).toBeNull();
    expect(getInternalLinkHref('//www.tjwiki.com/articles', siteOrigin)).toBeNull();
  });

  it('does not classify fragment, mail, telephone, or non-http URLs as internal', () => {
    expect(getInternalLinkHref('#details', siteOrigin)).toBeNull();
    expect(getInternalLinkHref('mailto:wiki@example.com', siteOrigin)).toBeNull();
    expect(getInternalLinkHref('tel:+8613800000000', siteOrigin)).toBeNull();
    expect(getInternalLinkHref('javascript:alert(1)', siteOrigin)).toBeNull();
  });
});
