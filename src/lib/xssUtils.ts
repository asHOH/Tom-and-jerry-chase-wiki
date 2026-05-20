import DOMPurify from 'dompurify';

import { ALLOWED_HTML_ATTRS, getAllowedHtmlTags, sanitizeClassAttributes } from '@/lib/xssConfig';

export function sanitizeHTML(
  html: string,
  { removeH1 = false }: { removeH1?: boolean } = {}
): string {
  DOMPurify.addHook('afterSanitizeAttributes', sanitizeClassAttributes);

  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: getAllowedHtmlTags(removeH1),
      ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
    }) as string;
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}
