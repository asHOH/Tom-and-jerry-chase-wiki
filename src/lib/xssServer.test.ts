import { sanitizeHTMLOnServer } from '@/lib/xssServer';

describe('sanitizeHTMLOnServer', () => {
  it('should preserve allowed markup while removing unsafe scripts', () => {
    const html =
      '<h1>标题</h1><p style="text-align:center;color:red">正文</p><script>alert(1)</script>';

    const sanitized = sanitizeHTMLOnServer(html);

    expect(sanitized).toContain('<h1>标题</h1>');
    expect(sanitized).toContain('<p style="text-align:center;">正文</p>');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('color:red');
  });

  it('should remove h1 when requested', () => {
    const sanitized = sanitizeHTMLOnServer('<h1>标题</h1><h2>小节</h2>', { removeH1: true });

    expect(sanitized).not.toContain('<h1>');
    expect(sanitized).toContain('<h2>小节</h2>');
  });
});
