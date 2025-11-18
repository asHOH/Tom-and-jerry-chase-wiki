import DOMPurify from 'dompurify';

export function sanitizeHTML(
  html: string,
  { removeH1 = false }: { removeH1?: boolean } = {}
): string {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const styleEntries = style.split(';').filter(Boolean);
      const allowedStyles = styleEntries.filter((s) => {
        const [prop, value] = s.split(':').map((part) => part.trim());
        return prop === 'text-align' && ['left', 'center', 'right', 'justify'].includes(value!);
      });

      if (allowedStyles.length > 0) {
        node.setAttribute('style', allowedStyles.join(';') + ';');
      } else {
        node.removeAttribute('style');
      }
    }
  });

  const sanitized = DOMPurify.sanitize(html, {
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
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'br',
      'hr',
      'img',
      // Table-related tags for article content
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'colgroup',
      'col',
    ].concat(removeH1 ? [] : ['h1']),
    ALLOWED_ATTR: [
      'href',
      'class',
      'style',
      'src',
      'alt',
      'title',
      // Table cell attributes
      'colspan',
      'rowspan',
      'scope',
    ],
  });

  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitized as string;
}
