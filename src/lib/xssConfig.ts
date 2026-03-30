type SanitizerNode = {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
};

export const ALLOWED_HTML_TAGS: string[] = [
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
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
];

export const ALLOWED_HTML_ATTRS: string[] = [
  'href',
  'class',
  'style',
  'src',
  'alt',
  'title',
  'colspan',
  'rowspan',
  'scope',
];

const ALLOWED_TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);

export function getAllowedHtmlTags(removeH1: boolean): string[] {
  return removeH1 ? ALLOWED_HTML_TAGS.filter((tag) => tag !== 'h1') : [...ALLOWED_HTML_TAGS];
}

export function sanitizeStyleAttributes(node: SanitizerNode): void {
  if (!node.hasAttribute('style')) {
    return;
  }

  const style = node.getAttribute('style') ?? '';
  const styleEntries = style.split(';').filter(Boolean);
  const allowedStyles = styleEntries.filter((entry) => {
    const [prop, value] = entry.split(':').map((part) => part.trim());
    return prop === 'text-align' && ALLOWED_TEXT_ALIGN_VALUES.has(value ?? '');
  });

  if (allowedStyles.length > 0) {
    node.setAttribute('style', `${allowedStyles.join(';')};`);
    return;
  }

  node.removeAttribute('style');
}
