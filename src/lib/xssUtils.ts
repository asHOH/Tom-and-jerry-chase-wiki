import DOMPurify from 'dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'del',
      'a',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'br',
      'hr',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'class', 'style', 'src', 'alt', 'title'],
  });
}
