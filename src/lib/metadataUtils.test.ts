import {
  generatePageMetadata,
  getCanonicalUrl,
  normalizeUrlWithTrailingSlash,
} from '@/lib/metadataUtils';

describe('metadataUtils', () => {
  it('should add trailing slashes to canonical paths', () => {
    expect(getCanonicalUrl('/articles/test')).toBe('https://www.tjwiki.com/articles/test/');
    expect(getCanonicalUrl('/')).toBe('https://www.tjwiki.com/');
  });

  it('should preserve query strings while normalizing trailing slashes', () => {
    expect(normalizeUrlWithTrailingSlash('https://www.tjwiki.com/ranks/speed?faction=cat')).toBe(
      'https://www.tjwiki.com/ranks/speed/?faction=cat'
    );
  });

  it('should normalize metadata canonicals before emitting metadata fields', () => {
    const metadata = generatePageMetadata({
      title: '工具',
      description: '工具页面',
      canonicalUrl: 'https://www.tjwiki.com/tools',
    });

    expect(metadata.alternates?.canonical).toBe('https://www.tjwiki.com/tools/');
    expect(metadata.openGraph?.url).toBe('https://www.tjwiki.com/tools/');
  });
});
