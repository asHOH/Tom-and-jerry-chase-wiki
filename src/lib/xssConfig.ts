type SanitizerNode = {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
};

const ALLOWED_HTML_TAGS: string[] = [
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
  'src',
  'alt',
  'title',
  'colspan',
  'rowspan',
  'scope',
];

export function getAllowedHtmlTags(removeH1: boolean): string[] {
  return removeH1 ? ALLOWED_HTML_TAGS.filter((tag) => tag !== 'h1') : [...ALLOWED_HTML_TAGS];
}

export const ALLOWED_CONTENT_CLASSES = new Set([
  'rte-text-left',
  'rte-text-center',
  'rte-text-right',
  'rte-text-justify',
]);

export function sanitizeClassAttributes(node: SanitizerNode): void {
  if (!node.hasAttribute('class')) {
    return;
  }

  const classes = (node.getAttribute('class') ?? '')
    .split(/\s+/)
    .filter((className) => ALLOWED_CONTENT_CLASSES.has(className));

  if (classes.length === 0) {
    node.removeAttribute('class');
    return;
  }

  node.setAttribute('class', classes.join(' '));
}
