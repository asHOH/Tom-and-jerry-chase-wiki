import {
  createDecorativeImageAttributes,
  RTE_IMAGE_PUBLIC_BASE,
  stripDisallowedImages,
} from './imagePolicy';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET: 'article-media',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  },
}));

describe('rich text image policy', () => {
  it('creates decorative image attributes for editor insertions', () => {
    expect(createDecorativeImageAttributes('/images/cards/S-card.png')).toEqual({
      src: '/images/cards/S-card.png',
      alt: '',
    });
  });

  it('adds empty alt text to allowed images without alt text', () => {
    const output = stripDisallowedImages('<p>ok</p><img src="/images/local.png" />');

    expect(output).toContain('src="/images/local.png"');
    expect(output).toContain('alt=""');
  });

  it('keeps existing alt text on allowed images', () => {
    const output = stripDisallowedImages('<img src="/images/local.png" alt="本地图片">');

    expect(output).toContain('alt="本地图片"');
  });

  it('allows images from the configured public storage bucket', () => {
    const imageUrl = `${RTE_IMAGE_PUBLIC_BASE}/articles/example.png`;

    expect(stripDisallowedImages(`<img src="${imageUrl}">`)).toContain(`src="${imageUrl}"`);
  });

  it.each([
    ['an external origin', 'https://example.com/image.png'],
    ['an insecure URL', 'http://project.supabase.co/image.png'],
    ['a protocol-relative URL', '//example.com/image.png'],
    ['a JavaScript URL', 'javascript:alert(1)'],
    ['a data URL', 'data:image/png;base64,AAAA'],
    ['a similarly prefixed storage bucket', `${RTE_IMAGE_PUBLIC_BASE}-private/secret.png`],
  ])('removes images using %s', (_description, src) => {
    expect(stripDisallowedImages(`<p>before</p><img src="${src}"><p>after</p>`)).toBe(
      '<p>before</p><p>after</p>'
    );
  });

  it('removes images without a source', () => {
    expect(stripDisallowedImages('<p>before</p><img alt="missing"><p>after</p>')).toBe(
      '<p>before</p><p>after</p>'
    );
  });

  it('strips inline event handlers from otherwise allowed images', () => {
    const output = stripDisallowedImages(
      '<img src="/images/local.png" onload="alert(1)" ONERROR="alert(2)">'
    );

    expect(output).toContain('src="/images/local.png"');
    expect(output).not.toMatch(/onload|onerror/i);
  });
});
