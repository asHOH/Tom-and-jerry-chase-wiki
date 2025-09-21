export function cleanHTMLForExport(html: string): string {
  let out = html;
  out = out.replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, '');
  out = out.replace(/<table\b([^>]*?)\sstyle="[^"]*"/gi, '<table$1');
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

import { useMemo } from 'react';

export function useCleanExport(html: string): string {
  return useMemo(() => cleanHTMLForExport(html), [html]);
}
