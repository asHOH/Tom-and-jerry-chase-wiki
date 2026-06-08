import 'server-only';

import sanitizeHtml from 'sanitize-html';

import { ALLOWED_CONTENT_CLASSES, ALLOWED_HTML_ATTRS, getAllowedHtmlTags } from '@/lib/xssConfig';

export function sanitizeHTMLOnServer(
  html: string,
  { removeH1 = false }: { removeH1?: boolean } = {}
): string {
  return sanitizeHtml(html, {
    allowedTags: getAllowedHtmlTags(removeH1),
    allowedAttributes: {
      '*': ALLOWED_HTML_ATTRS,
    },
    allowedClasses: {
      '*': [...ALLOWED_CONTENT_CLASSES],
    },
  });
}
