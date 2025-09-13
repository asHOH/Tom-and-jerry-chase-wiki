/**
 * This file contains utility functions to convert between Tiptap-generated HTML
 * and a simplified WikiText format (inspired by MediaWiki and wiky.js).
 *
 * NOTE: These conversions are based on regular expressions and have limitations.
 * They are designed to work for the specific set of extensions used in
 * RichTextEditor.tsx and may not handle complex or deeply nested structures correctly.
 * This approach is taken to avoid heavy third-party HTML parser libraries.
 */

const processInlines = (text: string): string => {
  return text
    .replace(/'''(.*?)'''/g, '<strong>$1</strong>')
    .replace(/''(.*?)''/g, '<em>$1</em>')
    .replace(/\[\[File:([^\]]+)\s?([^\]]*)\]\]/g, '<img src="$1" alt="$2">')
    .replace(
      /\[\[Video:([^\]]+)\]\]/g,
      '<iframe src="$1" frameborder="0" allowfullscreen></iframe>'
    )
    .replace(/ \[([^\[\]]+)\s([^\[\]]+)\]/g, '<a href="$1">$2</a>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
};

const closeAll = (htmlLines: string[], listStack: string[], inBlockquote: boolean) => {
  while (listStack.length > 0) {
    htmlLines.push(`</${listStack.pop()}>`);
  }
  if (inBlockquote) {
    htmlLines.push('</blockquote>');
  }
  return false;
};

export function wikiTextToHTML(wikiText: string): string {
  if (!wikiText) return '';

  const codeBlocks: string[] = [];
  const text = wikiText.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const lines = text.split('\n');
  const htmlLines: string[] = [];
  const listStack: string[] = [];
  let inBlockquote = false;

  for (const line of lines) {
    if (line.trim() === '') {
      inBlockquote = closeAll(htmlLines, listStack, inBlockquote);
      htmlLines.push('');
      continue;
    }

    if (line.startsWith('__CODE_BLOCK_')) {
      inBlockquote = closeAll(htmlLines, listStack, inBlockquote);
      htmlLines.push(line);
      continue;
    }

    if (line.startsWith('== ') && line.endsWith(' ==')) {
      htmlLines.push(`<h1>${processInlines(line.substring(3, line.length - 3).trim())}</h1>`);
      continue;
    }
    if (line.startsWith('=== ') && line.endsWith(' ===')) {
      htmlLines.push(`<h2>${processInlines(line.substring(4, line.length - 4).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('==== ') && line.endsWith(' ====')) {
      htmlLines.push(`<h3>${processInlines(line.substring(5, line.length - 5).trim())}</h3>`);
      continue;
    }
    if (line.startsWith('===== ') && line.endsWith(' =====')) {
      htmlLines.push(`<h4>${processInlines(line.substring(6, line.length - 6).trim())}</h4>`);
      continue;
    }
    if (line.startsWith('====== ') && line.endsWith(' ======')) {
      htmlLines.push(`<h5>${processInlines(line.substring(7, line.length - 7).trim())}</h5>`);
      continue;
    }

    if (line.match(/^----*$/)) {
      htmlLines.push('<hr>');
      continue;
    }

    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        inBlockquote = true;
        htmlLines.push('<blockquote>');
      }
      htmlLines.push(`<p>${processInlines(line.substring(2))}</p>`);
      continue;
    }

    const listMatch = line.match(/^([*#]+)\s(.*)/);
    if (listMatch) {
      const level = listMatch[1]?.length ?? 0;
      const type = listMatch[1]?.[0] === '*' ? 'ul' : 'ol';
      const content = listMatch[2] ?? '';

      while (listStack.length > level) {
        htmlLines.push(`</${listStack.pop()}>`);
      }
      if (listStack.length < level) {
        htmlLines.push(`<${type}>`);
        listStack.push(type);
      }
      htmlLines.push(`<li>${processInlines(content)}</li>`);
      continue;
    }

    inBlockquote = closeAll(htmlLines, listStack, inBlockquote);
    htmlLines.push(`<p>${processInlines(line)}</p>`);
  }

  closeAll(htmlLines, listStack, inBlockquote);

  let html = htmlLines.join('\n');
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[parseInt(index, 10)] || '';
  });

  return html.replace(/\n{2,}/g, '\n').trim();
}

export function htmlToWikiText(html: string): string {
  if (!html) return '';

  let text = `\n${html}\n`;

  // Handle <p> tags inside <li> by converting them to newlines
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, content) => {
    void match;
    const newContent = content.replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<\/?p[^>]*>/gi, '');
    return `<li>${newContent.trim()}</li>`;
  });

  text = text.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');

  text = text.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');
  text = text.replace(/<iframe src="([^"]+)"[^>]*><\/iframe>/gi, '[[Video:$1]]');

  text = text.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const innerText = htmlToWikiText(content.trim());
    return `\n${innerText
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}\n`;
  });

  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n== $1 ==\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n=== $1 ===\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n==== $1 ====\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n===== $1 =====\n');
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n====== $1 ======\n');

  const stack: string[] = [];
  text = text.replace(/<(ul|ol)[^>]*>|<\/(ul|ol)>|<li[^>]*>|<\/li>/gi, (tag) => {
    if (tag.startsWith('<ul')) {
      stack.push('*');
      return '';
    }
    if (tag.startsWith('<ol')) {
      stack.push('#');
      return '';
    }
    if (tag.startsWith('</ul') || tag.startsWith('</ol')) {
      if (stack.length > 0) stack.pop();
      return '';
    }
    if (tag.startsWith('<li')) {
      const marker = stack.length > 0 ? stack[stack.length - 1] : '*';
      return '\n' + marker!.repeat(stack.length || 1) + ' ';
    }
    if (tag.startsWith('</li')) {
      return '';
    }
    return '';
  });

  text = text.replace(/<hr[^>]*>/gi, '\n----\n');

  text = text.replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_, url, content) => {
    return ` [${url.replace(/ /g, '%20')} ${content}]`;
  });
  text = text.replace(/<img src="([^"]+)" alt="([^"]*)"[^>]*>/gi, '[[File:$1 $2]]');
  text = text.replace(/<strong>(.*?)<\/strong>/gi, "'''$1'''");
  text = text.replace(/<em>(.*?)<\/em>/gi, "''$1''");
  text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  text = text.replace(/<[^>]+>/g, '').replace(/(\n\s*){3,}/g, '\n\n');

  return text.trim();
}
