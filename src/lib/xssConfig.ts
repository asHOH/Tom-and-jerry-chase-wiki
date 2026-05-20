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
