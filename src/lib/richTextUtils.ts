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
    .replace(/(^|\s+)\[([^\[\]]+)\s([^\[\]]+)\]/g, '$1<a href="$2">$3</a>')
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

const parseWikiTable = (tableContent: string): string => {
  const lines = tableContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
  const htmlLines: string[] = [];

  let tableClass = '';
  let inRow = false;
  let isFirstCellInRow = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Table opening with optional class
    if (line.startsWith('class=')) {
      const classMatch = line.match(/class="([^"]+)"/);
      if (classMatch && classMatch[1]) {
        tableClass = classMatch[1];
      }
      continue;
    }

    // Row separator
    if (line === '|-') {
      if (inRow) {
        htmlLines.push('</tr>');
      }
      htmlLines.push('<tr>');
      inRow = true;
      isFirstCellInRow = true;
      continue;
    }

    // Header row indicator (standalone !) - creates empty header cell
    if (line === '!') {
      if (!inRow) {
        htmlLines.push('<tr>');
        inRow = true;
        isFirstCellInRow = true;
      }
      htmlLines.push('<th></th>');
      isFirstCellInRow = false;
      continue;
    }

    // Header cell (starts with ! and has content)
    if (line.startsWith('!') && line.length > 1) {
      if (!inRow) {
        htmlLines.push('<tr>');
        inRow = true;
        isFirstCellInRow = true;
      }
      const cellContent = line.substring(1).trim();
      htmlLines.push(`<th>${processInlines(cellContent)}</th>`);
      isFirstCellInRow = false;
      continue;
    }

    // Data cell (starts with |)
    if (line.startsWith('|')) {
      if (!inRow) {
        htmlLines.push('<tr>');
        inRow = true;
        isFirstCellInRow = true;
      }

      const cellContent = line.substring(1).trim();

      // Check if this is a row header (first cell in a row after |- with multiple data cells following)
      // Only for complex tables with mixed content (like the sample table with row headers)
      let isRowHeader = false;
      if (isFirstCellInRow) {
        // Count how many data cells follow in this row
        let dataCellCount = 0;
        for (let j = i; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine === '|-' || nextLine === '!' || !nextLine) break;
          if (nextLine?.startsWith('|')) {
            dataCellCount++;
          }
        }
        // Only make it a header if there are 3+ cells in the row (indicating a complex data table)
        // and the first cell looks like it could be a label/header
        isRowHeader = dataCellCount >= 3 && cellContent.length > 1;
      }

      const tag = isRowHeader ? 'th' : 'td';
      htmlLines.push(`<${tag}>${processInlines(cellContent)}</${tag}>`);
      isFirstCellInRow = false;
      continue;
    }
  }

  // Close any open row
  if (inRow) {
    htmlLines.push('</tr>');
  }

  const classAttr = tableClass ? ` class="${tableClass}"` : '';
  return `<table${classAttr}>\n${htmlLines.join('\n')}\n</table>`;
};

const parseHTMLTable = (tableHTML: string): string => {
  // Extract class attribute if present
  const classMatch = tableHTML.match(/<table[^>]*class="([^"]+)"/i);
  const tableClass = classMatch ? classMatch[1] : '';

  // Extract table content
  const contentMatch = tableHTML.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!contentMatch || !contentMatch[1]) return '';

  const content = contentMatch[1];
  const wikiLines: string[] = [];

  // Start table with class if present
  if (tableClass) {
    wikiLines.push(`{| class="${tableClass}"`);
  } else {
    wikiLines.push('{|');
  }

  // Process rows
  const rows = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rowContent = row.replace(/<\/?tr[^>]*>/gi, '');

    // Add row separator (except for first row)
    if (i > 0) {
      wikiLines.push('|-');
    }

    // Process cells
    const cells = rowContent.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi) || [];

    for (const cell of cells) {
      const cellMatch = cell.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/i);
      if (!cellMatch || !cellMatch[2]) continue;

      const isHeader = cellMatch[1] === 'th';
      const cellContent = cellMatch[2].trim();

      // Remove HTML tags from cell content and convert back to WikiText
      const cleanContent = cellContent
        .replace(/<strong>(.*?)<\/strong>/gi, "'''$1'''")
        .replace(/<em>(.*?)<\/em>/gi, "''$1''")
        .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
        .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, ' [$1 $2]')
        .replace(/<img src="([^"]+)" alt="([^"]*)"[^>]*>/gi, '[[File:$1 $2]]')
        .replace(/<[^>]+>/g, ''); // Remove any remaining HTML tags

      const prefix = isHeader ? '!' : '|';
      wikiLines.push(`${prefix} ${cleanContent}`);
    }
  }

  wikiLines.push('|}');
  return wikiLines.join('\n');
};

export function wikiTextToHTML(wikiText: string): string {
  if (!wikiText) return '';

  const codeBlocks: string[] = [];
  const tables: string[] = [];

  // Extract and temporarily replace tables
  let text = wikiText.replace(/\{\|([\s\S]*?)\|\}/gm, (_, tableContent) => {
    const htmlTable = parseWikiTable(tableContent);
    tables.push(htmlTable);
    return `__TABLE_${tables.length - 1}__`;
  });

  text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
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

    if (line.startsWith('__TABLE_')) {
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
  html = html.replace(/__TABLE_(\d+)__/g, (_, index) => {
    return tables[parseInt(index, 10)] || '';
  });

  return html.replace(/\n{2,}/g, '\n').trim();
}

export function htmlToWikiText(html: string): string {
  if (!html) return '';

  let text = `\n${html}\n`;

  // Convert HTML tables to WikiText
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableHTML) => {
    return `\n${parseHTMLTable(tableHTML)}\n`;
  });

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
