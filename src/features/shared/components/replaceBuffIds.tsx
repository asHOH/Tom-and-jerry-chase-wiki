// replaceBuffIds.ts
import buffData from '@/data/allBuffDetailedDescriptions.json';

const buffMap: Record<string, string> = buffData;

/**
 * 提取字符串中第一对双引号内的内容（支持英文双引号 " 以及中文双引号 “ ”）
 * 若未找到有效引号对，返回空字符串
 */
function extractFirstQuotedContent(text: string | undefined): string {
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
  // 匹配：引号内容 | 运算符/逗号/顿号 | 数字（含小数点）
  const valueRegex = /([“"][^”"]*[”"])|[+\-×÷,、]|\d+(?:\.\d+)?/g;
  let match;
  const valueParts: string[] = [];
  let lastIndex = 0;
  const typeParts: string[] = [];

  while ((match = valueRegex.exec(field)) !== null) {
    // 将匹配之前的普通字符加入 typeParts
    if (match.index > lastIndex) {
      typeParts.push(field.substring(lastIndex, match.index));
    }
    // 匹配到的内容属于字段值
    let matched = match[0];
    // 如果是引号内容，去掉引号本身，只保留内部文字
    if (matched.startsWith('"') || matched.startsWith('“')) {
      matched = matched.slice(1, -1);
    }
    valueParts.push(matched);
    lastIndex = match.index + match[0].length;
  }
  // 剩余字符加入 typeParts
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
 * @returns 索引位置，未找到返回 -1
 */
function findFirstNonQuotedMatch(text: string): number {
  const operatorRegex = /[+\-×÷]/;
  const keywords = ['提高', '降低', '增加', '减少', '提前'];
  let inQuote = false;
  let quoteChar: string | null = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // 进入引号
    if (!inQuote && (ch === '"' || ch === '“')) {
      inQuote = true;
      quoteChar = ch;
      i++;
      continue;
    }
    // 退出引号
    if (inQuote) {
      const closeQuote = quoteChar === '"' ? '"' : '”';
      if (ch === closeQuote) {
        inQuote = false;
        quoteChar = null;
      }
      i++;
      continue;
    }
    // 不在引号内，检查运算符
    if (operatorRegex.test(ch || '')) {
      return i;
    }
    // 检查关键词
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
 * 忽略引号内的内容，在第一个运算符或关键词前插入
 * 如果找不到合适位置，则插入在最前面
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
 * @param desc1 第一个 Buff 的完整描述
 * @param desc2 第二个 Buff 的完整描述
 * @param name2 第二个 Buff 的名称（用于前缀）
 * @returns 格式化后的差异描述字符串，如果完全相同则返回空字符串
 */
function compareBuffDescriptions(desc1: string, desc2: string, name2: string): string {
  // 提取名称（第一个“：”之前，包括“：”）
  const colonIndex1 = desc1.search(/[：:]/);
  const colonIndex2 = desc2.search(/[：:]/);
  if (colonIndex1 === -1 || colonIndex2 === -1) return ''; // 容错

  const name1 = desc1.slice(0, colonIndex1 + 1);

  // 描述主体：从冒号后到最后一个句号前
  const lastPeriod1 = desc1.lastIndexOf('。');
  const lastPeriod2 = desc2.lastIndexOf('。');
  const content1 = desc1.slice(colonIndex1 + 1, lastPeriod1 === -1 ? undefined : lastPeriod1);
  const content2 = desc2.slice(colonIndex2 + 1, lastPeriod2 === -1 ? undefined : lastPeriod2);

  // 以中文分号分割子字段
  const list1Raw = content1.split('；').filter((s) => s.trim().length > 0);
  const list2Raw = content2.split('；').filter((s) => s.trim().length > 0);

  // 存储每个字段的原始字符串、类型、值
  const fields1 = list1Raw.map((field) => ({
    original: field,
    ...extractTypeAndValue(field),
  }));
  const fields2 = list2Raw.map((field) => ({
    original: field,
    ...extractTypeAndValue(field),
  }));

  // 构建 id2 的类型->字段映射
  const map2 = new Map<string, { original: string; value: string }>();
  for (const f of fields2) {
    if (!map2.has(f.type)) {
      map2.set(f.type, { original: f.original, value: f.value });
    }
  }

  // 分别收集新增、改为、不再的字段
  const addedFields: string[] = [];
  const changedFields: string[] = [];
  const removedFields: string[] = [];

  // 处理 id1 的每个字段
  for (const f of fields1) {
    const match = map2.get(f.type);
    if (match) {
      if (match.value === f.value) {
        // 完全相同，忽略
        map2.delete(f.type);
      } else {
        // ---------- 新增智能引号对比处理 ----------
        const fQuotes = extractAllQuotedPairs(f.original);
        const mQuotes = extractAllQuotedPairs(match.original);

        // 找出共同存在的引号内容
        const commonQuotes = fQuotes.filter((q) => mQuotes.includes(q));

        if (commonQuotes.length === 0) {
          // 无共同内容，保留原逻辑：改为
          changedFields.push(insertPrefix(f.original, '改为'));
          map2.delete(f.type);
        } else {
          // 有共同内容：删除双方 original 中的共同引号对
          const newFOriginal = removeQuotedPairs(f.original, commonQuotes);
          const newMOriginal = removeQuotedPairs(match.original, commonQuotes);

          // 判断子集关系
          const fIsSubset = fQuotes.every((q) => mQuotes.includes(q));
          const mIsSubset = mQuotes.every((q) => fQuotes.includes(q));

          if (fIsSubset && !mIsSubset) {
            // f 的所有引号内容都在 match 中 → f 无新增，只记录 match 的“不再”
            removedFields.push(insertPrefix(newMOriginal, '不再'));
          } else if (!fIsSubset && mIsSubset) {
            // match 的所有引号内容都在 f 中 → 只记录 f 的“新增”
            addedFields.push(insertPrefix(newFOriginal, '新增'));
          } else {
            // 互有独有 → 两边都记录
            if (newFOriginal.trim()) {
              addedFields.push(insertPrefix(newFOriginal, '新增'));
            }
            if (newMOriginal.trim()) {
              removedFields.push(insertPrefix(newMOriginal, '不再'));
            }
          }

          map2.delete(f.type);
        }
        // ---------- 结束智能引号对比处理 ----------
      }
    } else {
      // id1 独有 -> 新增（直接加在最前面，不智能匹配）
      addedFields.push('新增' + f.original);
    }
  }

  // 处理 id2 中剩余的字段 -> 不再（使用智能插入前缀）
  for (const f of fields2) {
    if (map2.has(f.type)) {
      removedFields.push(insertPrefix(f.original, '不再'));
    }
  }

  // 按顺序拼接：新增、改为、不再
  const allParts: string[] = [];
  if (addedFields.length) allParts.push(addedFields.join('；'));
  if (changedFields.length) allParts.push(changedFields.join('；'));
  if (removedFields.length) allParts.push(removedFields.join('；'));

  const processedContent = allParts.join('；');
  if (!processedContent) {
    // 完全无差异，返回空字符串，由调用方处理
    return '';
  }

  // 重组最终字符串：名称 + 相比(name2)： + 处理后的内容 + 句号
  return `${name1}相比“${name2}”：${processedContent}。`;
}

/**
 * 将字符串中的 !{buffID} 和 !{id1-id2} 替换为对应的 buff 描述文本
 */
export function replaceBuffIds(text: string): string {
  if (!text) return text;

  // 1. 处理 !{数字1-数字2} 格式
  const rangeRegex = /!\{(\d+)-(\d+)\}/g;
  let result = text.replace(rangeRegex, (match, id1Str, id2Str) => {
    const desc1 = buffMap[id1Str];
    const desc2 = buffMap[id2Str];
    if (desc1 === undefined || desc2 === undefined) {
      return match;
    }

    // 获取第二个 Buff 的名称
    const name2 = extractFirstQuotedContent(desc2);
    if (!name2) {
      // 如果提取失败，回退到显示第二个 Buff 的完整描述
      return desc2;
    }

    // 精细对比
    const diff = compareBuffDescriptions(desc1, desc2, name2);
    if (diff) {
      // 有差异，返回精细对比结果
      return diff;
    } else {
      // 完全无差异，输出简化格式：“name1”：与“name2”效果相同。
      const name1 = extractFirstQuotedContent(desc1);
      return `“${name1}”：与“${name2}”效果相同。`;
    }
  });

  // 2. 处理 !{数字} 格式（普通替换）
  const singleRegex = /!\{(\d+)\}/g;
  result = result.replace(singleRegex, (match, id) => {
    const description = buffMap[id];
    return description !== undefined ? description : match;
  });

  return result;
}
