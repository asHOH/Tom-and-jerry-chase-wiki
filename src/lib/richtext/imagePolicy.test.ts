import { createDecorativeImageAttributes, stripDisallowedImages } from './imagePolicy';

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
});
