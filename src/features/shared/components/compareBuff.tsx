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
  const keywords = ['提高', '降低', '增加', '减少', '提前', '附加', '隶属'];
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

/** 判断一段文本（不含前缀）是否属于免疫/清除相关 */
function isImmuneClearRelated(text: string): boolean {
  return /^(清除|免疫)/.test(text) || /会被.*清除/.test(text) || /会被.*免疫/.test(text);
}

// ---------- 辅助函数：标准化免疫/清除字段，去除嵌套的 [免疫](...) 或 [清除](...) ----------
function normalizeImmuneClearField(field: string): string {
  const prefixMatch = field.match(/^(新增|不再|改为)/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  let content = prefixMatch ? field.slice(prefix.length) : field;

  // 处理可被[免疫](...) 或 可被[清除](...)
  const nestedMatch = content.match(/^可被\[(免疫|清除)\]\((.+)\)$/);
  if (nestedMatch) {
    content = nestedMatch[2] || '';
    return prefix ? prefix + content : content;
  }

  // +++ 新增：处理 清除[部分状态](...) 或 免疫[部分状态](...) +++
  const partStateMatch = content.match(/^(清除|免疫)\[部分状态\]\((.+)\)$/);
  if (partStateMatch) {
    // 动作词（清除/免疫）已在内容开头，直接拼上括号内文本即可
    const action = partStateMatch[1] || '';
    const inner = partStateMatch[2] || '';
    content = action + inner;
    return prefix ? prefix + content : content;
  }

  // 若没有匹配，原样返回（但保留前缀）
  return prefix ? prefix + content : content;
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
  // 分类
  const immuneAdded: string[] = [];
  const immuneRemoved: string[] = [];
  const immuneChanged: string[] = [];
  const normalAdded: string[] = [];
  const normalChanged: string[] = [];
  const normalRemoved: string[] = [];

  const prefixRegex = /^(新增|不再|改为)/;

  for (const item of addedFields) {
    const raw = item.replace(prefixRegex, '');
    if (isImmuneClearRelated(raw)) immuneAdded.push(item);
    else normalAdded.push(item);
  }
  for (const item of removedFields) {
    const raw = item.replace(prefixRegex, '');
    if (isImmuneClearRelated(raw)) immuneRemoved.push(item);
    else normalRemoved.push(item);
  }
  for (const item of changedFields) {
    const raw = item.replace(prefixRegex, '');
    if (isImmuneClearRelated(raw)) immuneChanged.push(item);
    else normalChanged.push(item);
  }

  // ---------- 标准化免疫/清除条目 ----------
  const normAdded = immuneAdded.map(normalizeImmuneClearField);
  const normRemoved = immuneRemoved.map(normalizeImmuneClearField);
  const normChanged = immuneChanged.map(normalizeImmuneClearField);

  // ---------- 构建合并的免疫清除变化 ----------
  const allImmuneChanges: string[] = [];
  if (normAdded.length) allImmuneChanges.push(...normAdded);
  if (normRemoved.length) allImmuneChanges.push(...normRemoved);
  if (normChanged.length) allImmuneChanges.push(...normChanged);

  let mergedImmuneClear = '';
  if (allImmuneChanges.length) {
    mergedImmuneClear = `[免疫与清除列表发生变化](${allImmuneChanges.join('；')})`;
  }

  // ---------- 重新组装最终内容 ----------
  const allParts: string[] = [];
  if (normalAdded.length) allParts.push(normalAdded.join('；'));
  if (normalChanged.length) allParts.push(normalChanged.join('；'));
  if (normalRemoved.length) allParts.push(normalRemoved.join('；'));
  if (mergedImmuneClear) allParts.push(mergedImmuneClear);

  const processedContent = allParts.join('；');
  if (!processedContent) {
    return '';
  }
  return `${name1}相比“${name2}”：${processedContent}。`;
}
