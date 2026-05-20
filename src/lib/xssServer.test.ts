import { sanitizeHTMLOnServer } from '@/lib/xssServer';

describe('sanitizeHTMLOnServer', () => {
  it('should preserve allowed markup while removing unsafe scripts', () => {
    const html =
      '<h1>Title</h1><p style="text-align:center;color:red">Body</p><script>alert(1)</script>';

    const sanitized = sanitizeHTMLOnServer(html);

    expect(sanitized).toContain('<h1>Title</h1>');
    expect(sanitized).toContain('<p>Body</p>');
    expect(sanitized).not.toContain('style=');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('color:red');
  });

  it('should remove h1 when requested', () => {
    const sanitized = sanitizeHTMLOnServer('<h1>Title</h1><h2>Section</h2>', { removeH1: true });

    expect(sanitized).not.toContain('<h1>');
    expect(sanitized).toContain('<h2>Section</h2>');
  });

  it('should preserve class-based text alignment while removing inline styles', () => {
    const html = '<p class="rte-text-center" style="text-align:center">Body</p>';

    const sanitized = sanitizeHTMLOnServer(html);

    expect(sanitized).toBe('<p class="rte-text-center">Body</p>');
  });
});
