import { sanitizeHTML } from '@/lib/xssUtils';

describe('sanitizeHTML', () => {
  it('should preserve allowed markup while removing unsafe scripts', () => {
    const html =
      '<h1>Title</h1><p style="text-align:center;color:red">Body</p><script>alert(1)</script>';

    const sanitized = sanitizeHTML(html);

    expect(sanitized).toContain('<h1>Title</h1>');
    expect(sanitized).toContain('<p>Body</p>');
    expect(sanitized).not.toContain('style=');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('color:red');
  });

  it('should remove h1 when requested', () => {
    const sanitized = sanitizeHTML('<h1>Title</h1><h2>Section</h2>', { removeH1: true });

    expect(sanitized).not.toContain('<h1>');
    expect(sanitized).toContain('<h2>Section</h2>');
  });

  it('should preserve class-based text alignment while removing inline styles', () => {
    const html = '<p class="rte-text-center" style="text-align:center">Body</p>';

    const sanitized = sanitizeHTML(html);

    expect(sanitized).toBe('<p class="rte-text-center">Body</p>');
  });

  it('should remove classes outside the article content allowlist', () => {
    const html =
      '<p class="rte-text-center fixed inset-0">Body</p><a class="text-blue-600 underline" href="/articles">Link</a>';

    const sanitized = sanitizeHTML(html);

    expect(sanitized).toBe('<p class="rte-text-center">Body</p><a href="/articles">Link</a>');
  });

  it('should remove unsafe event handlers and JavaScript URLs', () => {
    const html =
      '<p onclick="alert(1)">Body</p><a href="javascript:alert(1)" onmouseover="alert(2)">Link</a>';

    const sanitized = sanitizeHTML(html);

    expect(sanitized).toBe('<p>Body</p><a>Link</a>');
  });

  it('should preserve relative links and image attributes', () => {
    const html = '<a href="/articles">Link</a><img src="/images/tom.png" alt="Tom" title="Tom">';

    const sanitized = sanitizeHTML(html);

    expect(sanitized).toBe(
      '<a href="/articles">Link</a><img src="/images/tom.png" alt="Tom" title="Tom" />'
    );
  });
});
