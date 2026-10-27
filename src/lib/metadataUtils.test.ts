import {
  createArticleJsonLd,
  generatePageMetadata,
  getCanonicalUrl,
  normalizeUrlWithTrailingSlash,
} from '@/lib/metadataUtils';
import { SITE_NAME, SITE_SHORT_NAME, SITE_URL } from '@/constants/seo';

describe('metadataUtils', () => {
  it('preserves the absolute homepage title in browser and sharing metadata', () => {
    const metadata = generatePageMetadata({
      title: SITE_NAME,
      description: '首页',
      canonicalUrl: SITE_URL,
      absoluteTitle: true,
    });

    expect(metadata.title).toEqual({ absolute: SITE_NAME });
    expect(metadata.openGraph?.title).toBe(SITE_NAME);
    expect(metadata.twitter?.title).toBe(SITE_NAME);
  });

  it.each(['地图', `地图 - ${SITE_SHORT_NAME}`, `地图 - ${SITE_NAME}`])(
    'keeps one site suffix for the page title %s',
    (title) => {
      const metadata = generatePageMetadata({
        title,
        description: '地图页面',
        canonicalUrl: `${SITE_URL}/maps/`,
      });

      expect(metadata.title).toBe('地图');
      expect(metadata.openGraph?.title).toBe(`地图 - ${SITE_SHORT_NAME}`);
      expect(metadata.twitter?.title).toBe(`地图 - ${SITE_SHORT_NAME}`);
    }
  );

  it('builds the Article envelope while preserving encoded paths and image URLs', () => {
    const path = `/items/${encodeURIComponent('测试 /?#名称')}`;
    expect(
      createArticleJsonLd({
        headline: '测试名称',
        description: '正文 <>&',
        path,
        image: '/images/test.png',
      })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '测试名称',
      description: '正文 <>&',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      image: '/images/test.png',
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
    });
  });

  it.each([undefined, ''])('preserves empty descriptions and image value %j', (image) => {
    const data = createArticleJsonLd({
      headline: '测试名称',
      description: '',
      path: '/cards/test',
      image,
    });
    expect(data.description).toBe('');
    expect(Object.hasOwn(data, 'image')).toBe(image !== undefined);
    expect(data.image).toBe(image);
    expect(data.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': `${SITE_URL}/cards/test`,
    });
  });

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
