import sanitizeHtml from 'sanitize-html';

import { ALLOWED_CONTENT_CLASSES } from '@/lib/xssConfig';

const NOTICE_TAGS = [
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
] as const;

export const sanitizeNoticeHTML = (html: string): string =>
  sanitizeHtml(html, {
    allowedTags: [...NOTICE_TAGS],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'title'],
    },
    allowedClasses: {
      '*': [...ALLOWED_CONTENT_CLASSES],
    },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
  });

export const hasNoticeText = (html: string): boolean =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\u00a0/g, ' ')
    .trim().length > 0;
