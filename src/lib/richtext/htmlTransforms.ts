import { ALLOWED_CONTENT_CLASSES } from '@/lib/xssConfig';

import { stripDisallowedImages } from './imagePolicy';

const TEXT_ALIGN_CLASS_BY_VALUE: Record<string, string> = {
  left: 'rte-text-left',
  center: 'rte-text-center',
  right: 'rte-text-right',
  justify: 'rte-text-justify',
};

const TEXT_ALIGN_STYLE_REGEX = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i;
const ALIGNABLE_BLOCK_TAG_REGEX = /<(p|h[1-6])\b([^>]*)>/gi;
const TAG_WITH_CLASS_ATTR_REGEX = /<([a-z][\w:-]*)([^>]*?)\sclass=(["'])(.*?)\3([^>]*)>/gi;
const CLASS_ATTR_REGEX = /\sclass=(["'])(.*?)\1/i;
const STYLE_ATTR_REGEX = /\sstyle=(["'])(.*?)\1/i;

function addClassAttribute(attributes: string, className: string): string {
  const classMatch = attributes.match(CLASS_ATTR_REGEX);
  if (!classMatch) {
    return `${attributes} class="${className}"`;
  }

  const fullMatch = classMatch[0];
  const quote = classMatch[1] ?? '"';
  const currentValue = classMatch[2] ?? '';
  const classNames = currentValue.split(/\s+/).filter(Boolean);
  if (classNames.includes(className)) {
    return attributes;
  }

  return attributes.replace(
    fullMatch,
    ` class=${quote}${[...classNames, className].join(' ')}${quote}`
  );
}

export function normalizeTextAlignAttributes(html: string): string {
  return html.replace(ALIGNABLE_BLOCK_TAG_REGEX, (tag, tagName: string, attributes: string) => {
    const style = attributes.match(STYLE_ATTR_REGEX)?.[2] ?? '';
    const alignValue = style.match(TEXT_ALIGN_STYLE_REGEX)?.[1]?.toLowerCase();
    const className = alignValue ? TEXT_ALIGN_CLASS_BY_VALUE[alignValue] : undefined;
    if (!className) {
      return tag;
    }

    return `<${tagName}${addClassAttribute(attributes, className)}>`;
  });
}

export function removeInlineStyleAttributes(html: string): string {
  return html.replace(/\sstyle=(?:"[^"]*"|'[^']*')/gi, '');
}

export function removeDisallowedClassAttributes(html: string): string {
  return html.replace(
    TAG_WITH_CLASS_ATTR_REGEX,
    (
      _tag,
      tagName: string,
      beforeClass: string,
      quote: string,
      classValue: string,
      afterClass: string
    ) => {
      const allowedClasses = classValue
        .split(/\s+/)
        .filter((className) => ALLOWED_CONTENT_CLASSES.has(className));

      if (allowedClasses.length === 0) {
        return `<${tagName}${beforeClass}${afterClass}>`;
      }

      return `<${tagName}${beforeClass} class=${quote}${allowedClasses.join(' ')}${quote}${afterClass}>`;
    }
  );
}

export function cleanHTMLForExport(html: string): string {
  let out = normalizeTextAlignAttributes(stripDisallowedImages(html));
  out = removeInlineStyleAttributes(out);
  out = removeDisallowedClassAttributes(out);
  out = out.replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, '');
  out = out.replace(/<(td|th)([^>]*)>\s*<p>([\s\S]*?)<\/p>\s*<\/\1>/gi, '<$1$2>$3</$1>');
  out = out.replace(/<table([^>]*)>\s*<p>\s*<\/p>/gi, '<table$1>');
  out = out.replace(/<\/table>\s*<p>\s*<\/p>/gi, '</table>');
  // Remove empty <p> immediately before table
  out = out.replace(/<p>\s*<\/p>\s*(?=<table\b)/gi, '');
  out = out.replace(/\s(colspan|rowspan)="1"/gi, '');
  out = out.replace(/<\/?tbody>/gi, '');
  out = out.replace(/<\/(p|div|section|article|h[1-6])>\s*<table/gi, '</$1>\n<table');
  out = out.replace(/<table(\b[^>]*)>/gi, '<table$1>\n');
  out = out.replace(/<\/table>/gi, '\n</table>');
  out = out.replace(/<tr(\b[^>]*)>/gi, '\n<tr$1>');
  out = out.replace(/<\/(tr)>/gi, '\n</$1>');
  out = out.replace(/<(th|td)(\b[^>]*)>/gi, '\n<$1$2>');
  out = out.replace(/<\/(th|td)>/gi, '</$1>\n');
  out = out.replace(/\n{2,}/g, '\n');
  out = out
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
  return out;
}
