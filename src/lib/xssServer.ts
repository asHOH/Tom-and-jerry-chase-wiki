import 'server-only';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

import { ALLOWED_HTML_ATTRS, getAllowedHtmlTags, sanitizeStyleAttributes } from '@/lib/xssConfig';

const serverWindow = new JSDOM('').window;

export function sanitizeHTMLOnServer(
  html: string,
  { removeH1 = false }: { removeH1?: boolean } = {}
): string {
  const DOMPurify = createDOMPurify(serverWindow);

  DOMPurify.addHook('afterSanitizeAttributes', sanitizeStyleAttributes);

  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: getAllowedHtmlTags(removeH1),
      ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
    }) as string;
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}
