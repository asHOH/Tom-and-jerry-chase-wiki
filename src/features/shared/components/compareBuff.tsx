/**
 * compareBuff.ts
 * 提供 Buff 描述对比功能：传入两个 Buff 描述，生成“第二个相对于第一个”的变化内容。
 */

/**
 * 提取字符串中第一对双引号内的内容（支持英文双引号 " 以及中文双引号 “ ”）
 * 若未找到有效引号对，返回空字符串
 */
export function extractFirstQuotedContent(text: string | undefined): string {
  if (!text) return '';
  const openQuoteMatch = text.match(/["“]/);
  if (!openQuoteMatch) return '';
  const openQuote = openQuoteMatch[0];
  const openIndex = openQuoteMatch.index!;
  const closeQuote = openQuote === '"' ? '"' : '”';
  const rest = text.slice(openIndex + 1);
  const closeIndex = rest.indexOf(closeQuote);
  if (closeIndex === -1) return '';
  return rest.slice(0, closeIndex);
}

/**
 * 提取字段中的“字段类型”和“字段值”
 * - 字段类型：移除引号内容、运算符、数字后剩余的字符
 * - 字段值：按顺序提取引号内的文字、四则运算符（+-×÷）、数字（含小数点）
 */
function extractTypeAndValue(field: string): { type: string; value: string } {
  const valueRegex = /([“"][^”"]*[”"])|[+\-×÷,、]|\d+(?:\.\d+)?/g;
  let match;
  const valueParts: string[] = [];
  let lastIndex = 0;
  const typeParts: string[] = [];

  while ((match = valueRegex.exec(field)) !== null) {
    if (match.index > lastIndex) {
      typeParts.push(field.substring(lastIndex, match.index));
    }
    let matched = match[0];
    if (matched.startsWith('"') || matched.startsWith('“')) {
      matched = matched.slice(1, -1);
    }
    valueParts.push(matched);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < field.length) {
    typeParts.push(field.substring(lastIndex));
  }

  return {
    type: typeParts.join(''),
    value: valueParts.join(''),
  };
}

/**
 * 查找第一个不在引号内的运算符或关键词的位置
 * 引号可以是英文双引号 " 或中文双引号 “ ”
 */
function findFirstNonQuotedMatch(text: string): number {
  const operatorRegex = /[+\-×÷]/;
  const keywords = ['提高', '降低', '增加', '减少', '提前'];
  let inQuote = false;
  let quoteChar: string | null = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (!inQuote && (ch === '"' || ch === '“')) {
      inQuote = true;
      quoteChar = ch;
      i++;
      continue;
    }
    if (inQuote) {
      const closeQuote = quoteChar === '"' ? '"' : '”';
      if (ch === closeQuote) {
        inQuote = false;
        quoteChar = null;
      }
      i++;
      continue;
    }
    if (operatorRegex.test(ch || '')) {
      return i;
    }
    for (const kw of keywords) {
      if (text.substr(i, kw.length) === kw) {
        return i;
      }
    }
    i++;
  }
  return -1;
}

/**
 * 在字段字符串中智能插入前缀（仅用于“改为”、“不再”、“新增”）
 */
function insertPrefix(originalField: string, prefix: string): string {
  const insertIndex = findFirstNonQuotedMatch(originalField);
  if (insertIndex === -1) {
    return prefix + originalField;
  }
  return originalField.slice(0, insertIndex) + prefix + originalField.slice(insertIndex);
}

/**
 * 从字符串中提取所有中文双引号对内的内容（不包括引号本身）
 */
function extractAllQuotedPairs(str: string): string[] {
  const regex = /“([^”]+)”/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
    matches.push(match[1] || '');
  }
  return matches;
}

/**
 * 从原始字符串中删除指定的多个中文引号对（完全匹配“内容”）
 */
function removeQuotedPairs(original: string, contentsToRemove: string[]): string {
  let result = original;
  for (const content of contentsToRemove) {
    const escaped = content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`“${escaped}”(、|，)`, 'g'), '');
    result = result.replace(new RegExp(`(、|，)“${escaped}”`, 'g'), '');
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * 精细对比两个 Buff 描述，生成差异描述
 * @param desc1 第一个 Buff 的完整描述（基准）
 * @param desc2 第二个 Buff 的完整描述（变化对象）
 * @param name2 第二个 Buff 的名称（用于前缀，通常传 desc2 的名称即可）
 * @returns 格式化后的差异描述字符串，如果完全相同则返回空字符串
 */
export function compareBuffDescriptions(desc1: string, desc2: string, name2: string): string {
  const colonIndex1 = desc1.search(/[：:]/);
  const colonIndex2 = desc2.search(/[：:]/);
  if (colonIndex1 === -1 || colonIndex2 === -1) return '';

  const name1 = desc1.slice(0, colonIndex1 + 1);

  const lastPeriod1 = desc1.lastIndexOf('。');
  const lastPeriod2 = desc2.lastIndexOf('。');
  const content1 = desc1.slice(colonIndex1 + 1, lastPeriod1 === -1 ? undefined : lastPeriod1);
  const content2 = desc2.slice(colonIndex2 + 1, lastPeriod2 === -1 ? undefined : lastPeriod2);

  const list1Raw = content1.split('；').filter((s) => s.trim().length > 0);
  const list2Raw = content2.split('；').filter((s) => s.trim().length > 0);

  const fields1 = list1Raw.map((field) => ({
    original: field,
    ...extractTypeAndValue(field),
  }));
  const fields2 = list2Raw.map((field) => ({
    original: field,
    ...extractTypeAndValue(field),
  }));

  const map2 = new Map<string, { original: string; value: string }>();
  for (const f of fields2) {
    if (!map2.has(f.type)) {
      map2.set(f.type, { original: f.original, value: f.value });
    }
  }

  const addedFields: string[] = [];
  const changedFields: string[] = [];
  const removedFields: string[] = [];

  for (const f of fields1) {
    const match = map2.get(f.type);
    if (match) {
      if (match.value === f.value) {
        map2.delete(f.type);
      } else {
        const fQuotes = extractAllQuotedPairs(f.original);
        const mQuotes = extractAllQuotedPairs(match.original);
        const commonQuotes = fQuotes.filter((q) => mQuotes.includes(q));

        if (commonQuotes.length === 0) {
          changedFields.push(insertPrefix(f.original, '改为'));
          map2.delete(f.type);
        } else {
          const newFOriginal = removeQuotedPairs(f.original, commonQuotes);
          const newMOriginal = removeQuotedPairs(match.original, commonQuotes);

          const fIsSubset = fQuotes.every((q) => mQuotes.includes(q));
          const mIsSubset = mQuotes.every((q) => fQuotes.includes(q));

          if (fIsSubset && !mIsSubset) {
            removedFields.push(insertPrefix(newMOriginal, '不再'));
          } else if (!fIsSubset && mIsSubset) {
            addedFields.push(insertPrefix(newFOriginal, '新增'));
          } else {
            if (newFOriginal.trim()) {
              addedFields.push(insertPrefix(newFOriginal, '新增'));
            }
            if (newMOriginal.trim()) {
              removedFields.push(insertPrefix(newMOriginal, '不再'));
            }
          }
          map2.delete(f.type);
        }
      }
    } else {
      addedFields.push('新增' + f.original);
    }
  }

  for (const f of fields2) {
    if (map2.has(f.type)) {
      removedFields.push(insertPrefix(f.original, '不再'));
    }
  }

  const allParts: string[] = [];
  if (addedFields.length) allParts.push(addedFields.join('；'));
  if (changedFields.length) allParts.push(changedFields.join('；'));
  if (removedFields.length) allParts.push(removedFields.join('；'));

  const processedContent = allParts.join('；');
  if (!processedContent) {
    return '';
  }

  return `${name1}相比“${name2}”：${processedContent}。`;
}
