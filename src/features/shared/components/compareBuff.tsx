/**
 * compareBuff.ts
 * 提供 Buff 描述对比功能。
 *
 * 语义约定：内部以 desc1 为「基准（当前/较新）」，desc2 为「对比对象（旧/参考）」，
 * 输出 `desc1 相比 desc2：变化内容`。
 */

// ============================================================
// 常量
// ============================================================

const CONNECTOR_REGEX = /^(也|且|并|或|但|同时|而且|以及|另外)(.*)$/;

const GROUP_FIELD_REGEX = /^隶属于?分组(\d+(?:\s*[,，、]\s*\d+)*)$/;

const NUMBER_UNIT_REGEX = /^(%|\/秒|HP\/秒|HP|秒后|秒|层|点|距离|个|次|倍|处|\*)/;

const NAME_QUOTE_REGEX = /“([^”]+)”/g;

// ============================================================
// 导出：extractFirstQuotedContent（兼容原有，增强 [X](note) 处理）
// ============================================================

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
  let content = rest.slice(0, closeIndex);
  // 支持 “[名称](note)” 形式
  const bracketMatch = content.match(/^\[([^\]]+)\]\([^)]*\)$/);
  if (bracketMatch) {
    content = bracketMatch[1] || '';
  }
  return content;
}

// ============================================================
// 基础类型
// ============================================================

interface NumberToken {
  sign: string;
  value: string;
  unit: string;
  start: number;
  end: number;
  isDamage?: boolean;
  rawDamage?: string;
}

interface LinkToken {
  text: string;
  note: string;
}

interface Atoms {
  raw: string;
  skeleton: string;
  numbers: NumberToken[];
  tags: string[];
  quotes: string[];
  links: LinkToken[];
  parens: string[];
}

interface NameItems {
  expanded: string[];
  rawMap: Map<string, string>;
}

interface ImmuneClear {
  direction: 'self' | 'passive';
  action: 'immune' | 'clear';
  items: NameItems;
}

interface Unit {
  raw: string;
  text: string;
  kind: 'group' | 'helpful' | 'immuneClear' | 'normal';
  atoms?: Atoms;
  groups?: number[];
  helpful?: 'positive' | 'negative';
  ic?: ImmuneClear;
}

// ============================================================
// 名称/字段拆分
// ============================================================

function findNameColonIndex(desc: string): number {
  const m = desc.match(/[”"][：:]/);
  if (m && m.index !== undefined) return m.index + 1;
  return desc.search(/[：:]/);
}

function parseDescription(
  desc: string
): { nameDisplay: string; namePlain: string; body: string } | null {
  const colonIndex = findNameColonIndex(desc);
  if (colonIndex === -1) return null;
  const nameDisplay = desc.slice(0, colonIndex);
  const namePlain = extractFirstQuotedContent(desc);
  const lastPeriod = desc.endsWith('。') ? desc.length - 1 : desc.length;
  const body = desc.slice(colonIndex + 1, lastPeriod);
  return { nameDisplay, namePlain, body };
}

/**
 * 顶层分割：按 separators 中的字符分割，跳过 “”、{}、[]()、（）、$..$#.. 内部。
 */
function splitTopLevel(text: string, separators: string[]): string[] {
  const result: string[] = [];
  const sepSet = new Set(separators);
  let current = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    // 双引号/中文引号
    if (ch === '“' || ch === '"') {
      const close = ch === '“' ? '”' : '"';
      let j = i + 1;
      while (j < text.length && text[j] !== close) j++;
      const end = j < text.length ? j + 1 : text.length;
      current += text.slice(i, end);
      i = end;
      continue;
    }

    // {}
    if (ch === '{') {
      let j = i + 1;
      while (j < text.length && text[j] !== '}') j++;
      const end = j < text.length ? j + 1 : text.length;
      current += text.slice(i, end);
      i = end;
      continue;
    }

    // 中文括号
    if (ch === '（') {
      let j = i + 1;
      while (j < text.length && text[j] !== '）') j++;
      const end = j < text.length ? j + 1 : text.length;
      current += text.slice(i, end);
      i = end;
      continue;
    }

    // [文本](note)
    if (ch === '[') {
      let j = i + 1;
      while (j < text.length && text[j] !== ']') j++;
      if (j < text.length && text[j + 1] === '(') {
        let k = j + 2;
        let depth = 1;
        while (k < text.length && depth > 0) {
          if (text[k] === '(') depth++;
          else if (text[k] === ')') depth--;
          k++;
        }
        current += text.slice(i, k);
        i = k;
        continue;
      }
      const end = j < text.length ? j + 1 : text.length;
      current += text.slice(i, end);
      i = end;
      continue;
    }

    // $..$#.. —— 剥离但保留
    if (ch === '$') {
      let j = i + 1;
      while (j < text.length && text[j] !== '$') j++;
      if (j < text.length) {
        let k = j + 1;
        if (text[k] === '#') {
          k++;
          while (k < text.length && !/[\s，；。、]/.test(text[k]!)) k++;
        }
        current += text.slice(i, k);
        i = k;
        continue;
      }
      current += ch;
      i++;
      continue;
    }

    if (sepSet.has(ch)) {
      if (current.trim()) result.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function stripConnector(text: string): { text: string; connector: string } {
  const m = text.match(CONNECTOR_REGEX);
  if (m) return { text: (m[2] ?? '').trim(), connector: m[1] ?? '' };
  return { text, connector: '' };
}

// ============================================================
// 原子解析
// ============================================================

function parseAtoms(clause: string): Atoms {
  const numbers: NumberToken[] = [];
  const tags: string[] = [];
  const quotes: string[] = [];
  const links: LinkToken[] = [];
  const parens: string[] = [];

  let skeleton = '';
  let i = 0;
  let pendingOperator = '';
  let pendingOperatorStart = -1;

  while (i < clause.length) {
    const ch = clause[i]!;

    // 引号
    if (ch === '“' || ch === '"') {
      const close = ch === '“' ? '”' : '"';
      let j = i + 1;
      while (j < clause.length && clause[j] !== close) j++;
      quotes.push(clause.slice(i + 1, j));
      skeleton += '“”';
      i = j + 1;
      pendingOperator = '';
      continue;
    }

    // {}
    if (ch === '{') {
      let j = i + 1;
      while (j < clause.length && clause[j] !== '}') j++;
      const inner = clause.slice(i + 1, j);

      // 伤害数值：{数字*...}，作为 numbers 处理，不作为 tag
      const dmgMatch = inner.match(/^(\d+(?:\.\d+)?)\*(.*)$/);
      if (dmgMatch) {
        numbers.push({
          sign: pendingOperator,
          value: dmgMatch[1] || '',
          unit: dmgMatch[2] || '',
          start: pendingOperator ? pendingOperatorStart : i,
          end: j + 1,
          isDamage: true,
          rawDamage: clause.slice(i, j + 1),
        });
        skeleton += '<D>';
        pendingOperator = '';
        i = j + 1;
        continue;
      }

      tags.push(inner);
      skeleton += '{}';
      i = j + 1;
      pendingOperator = '';
      continue;
    }

    // [文本](note)
    if (ch === '[') {
      let j = i + 1;
      while (j < clause.length && clause[j] !== ']') j++;
      if (j < clause.length && clause[j + 1] === '(') {
        let k = j + 2;
        let depth = 1;
        while (k < clause.length && depth > 0) {
          if (clause[k] === '(') depth++;
          else if (clause[k] === ')') depth--;
          k++;
        }
        links.push({
          text: clause.slice(i + 1, j),
          note: clause.slice(j + 2, k - 1),
        });
        skeleton += '[]()';
        i = k;
        pendingOperator = '';
        continue;
      }
      skeleton += '[';
      i++;
      continue;
    }

    // （中文括号）
    if (ch === '（') {
      let j = i + 1;
      while (j < clause.length && clause[j] !== '）') j++;
      parens.push(clause.slice(i + 1, j));
      skeleton += '（）';
      i = j + 1;
      pendingOperator = '';
      continue;
    }

    // 运算符（暂存）
    if (ch === '+' || ch === '×' || ch === '÷') {
      pendingOperator = ch;
      pendingOperatorStart = i;
      i++;
      continue;
    }

    // - 号：负号 vs 名称连接符
    if (ch === '-') {
      const next = clause[i + 1];
      const prev = i > 0 ? clause[i - 1]! : '';
      const isNegative = !!next && /[0-9]/.test(next) && !/[A-Za-z0-9\u4e00-\u9fa5]/.test(prev);
      if (isNegative) {
        pendingOperator = '-';
        pendingOperatorStart = i;
        i++;
        continue;
      }
      if (pendingOperator) {
        skeleton += pendingOperator;
        pendingOperator = '';
      }
      skeleton += ch;
      i++;
      continue;
    }

    // 数字
    if (/[0-9]/.test(ch)) {
      const m = clause.slice(i).match(/^\d+(?:\.\d+)?/);
      const value = m ? m[0] : '';
      let end = i + value.length;
      const unitM = clause.slice(end).match(NUMBER_UNIT_REGEX);
      const unit = unitM ? unitM[0] : '';
      end += unit.length;

      const sign = pendingOperator;
      const start = pendingOperator ? pendingOperatorStart : i;
      numbers.push({ sign, value, unit, start, end });
      skeleton += '<N>';
      pendingOperator = '';
      i = end;
      continue;
    }

    if (pendingOperator) {
      skeleton += pendingOperator;
      pendingOperator = '';
    }
    skeleton += ch;
    i++;
  }

  if (pendingOperator) skeleton += pendingOperator;

  return { raw: clause, skeleton, numbers, tags, quotes, links, parens };
}

// ============================================================
// 变体名展开
// ============================================================

function expandVariantName(name: string): string[] {
  // X-（1、2） / X-(1、2) / X-（Lv1、Lv2、Lv3）
  const fullMatch = name.match(/^(.+?)-[（(]([^）)]+)[）)]$/);
  if (fullMatch) {
    const base = fullMatch[1]!;
    const parts = (fullMatch[2] ?? '')
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p) => `${base}-${p}`);
    }
  }
  // X-1,2
  const commaMatch = name.match(/^(.+?)-(\d+(?:,\d+)+)$/);
  if (commaMatch) {
    const base = commaMatch[1]!;
    return (commaMatch[2] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => `${base}-${n}`);
  }
  return [name];
}

function extractNameItems(text: string): NameItems {
  const expanded: string[] = [];
  const rawMap = new Map<string, string>();
  const regex = new RegExp(NAME_QUOTE_REGEX.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const rawName = m[1] ?? '';
    if (!rawName) continue;
    for (const e of expandVariantName(rawName)) {
      if (!rawMap.has(e)) {
        expanded.push(e);
        rawMap.set(e, rawName);
      }
    }
  }
  return { expanded, rawMap };
}

// ============================================================
// 免疫/清除分类
// ============================================================

function classifyImmuneClear(clause: string): ImmuneClear | null {
  const t = clause.trim();

  if (t.startsWith('清除')) {
    return { direction: 'self', action: 'clear', items: extractNameItems(t.slice(2)) };
  }
  if (t.startsWith('免疫')) {
    return { direction: 'self', action: 'immune', items: extractNameItems(t.slice(2)) };
  }

  // 会被“X”免疫
  const pim = t.match(/^会被(.+?)免疫$/);
  if (pim) {
    return {
      direction: 'passive',
      action: 'immune',
      items: extractNameItems(pim[1] ?? ''),
    };
  }

  // 可被[清除](会被“X”清除) / 可被[免疫](会被“X”免疫)
  const pcl = t.match(/^可被\[(清除|免疫)\]\((.+)\)$/);
  if (pcl) {
    const action: 'clear' | 'immune' = pcl[1] === '清除' ? 'clear' : 'immune';
    let inner = pcl[2] ?? '';
    inner = inner.replace(/^会被/, '').replace(/(清除|免疫)$/, '');
    return { direction: 'passive', action, items: extractNameItems(inner) };
  }

  return null;
}

// ============================================================
// 字段分类与拆解
// ============================================================

function classifyField(text: string): Unit {
  const trimmed = text.trim();

  const gm = trimmed.match(GROUP_FIELD_REGEX);
  if (gm) {
    const groups = (gm[1] ?? '')
      .split(/[,，、]/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));
    return { raw: trimmed, text: trimmed, kind: 'group', groups };
  }

  if (trimmed === '属正面状态') {
    return { raw: trimmed, text: trimmed, kind: 'helpful', helpful: 'positive' };
  }
  if (trimmed === '属负面状态') {
    return { raw: trimmed, text: trimmed, kind: 'helpful', helpful: 'negative' };
  }

  const ic = classifyImmuneClear(trimmed);
  if (ic) {
    return { raw: trimmed, text: trimmed, kind: 'immuneClear', ic };
  }

  return {
    raw: trimmed,
    text: trimmed,
    kind: 'normal',
    atoms: parseAtoms(trimmed),
  };
}

function splitToUnits(body: string): Unit[] {
  const fields = splitTopLevel(body, ['；']);
  const units: Unit[] = [];

  for (const field of fields) {
    // 先尝试整体分类
    const whole = classifyField(field);
    if (whole.kind !== 'normal') {
      units.push(whole);
      continue;
    }
    // 按 ， 拆分
    const subs = splitTopLevel(field, ['，']);
    for (const sub of subs) {
      const { text } = stripConnector(sub);
      const classified = classifyField(text);
      classified.raw = sub;
      units.push(classified);
    }
  }

  return units;
}

// ============================================================
// 相等判断与集合 diff
// ============================================================

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function numbersEqual(a: NumberToken[], b: NumberToken[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x.sign !== y.sign || x.value !== y.value || x.unit !== y.unit) return false;
    if (!!x.isDamage !== !!y.isDamage) return false;
  }
  return true;
}

function linksEqual(a: LinkToken[], b: LinkToken[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x.text !== y.text || x.note !== y.note) return false;
  }
  return true;
}

function computeDiffNames(
  expList: string[],
  expSet: Set<string>,
  rawMap: Map<string, string>
): string[] {
  const result: string[] = [];
  const processedRaw = new Set<string>();

  for (const e of expList) {
    const raw = rawMap.get(e) ?? e;
    if (processedRaw.has(raw)) continue;
    processedRaw.add(raw);

    const variants = expandVariantName(raw);
    const allInSet = variants.every((v) => expSet.has(v));
    if (allInSet && variants.length > 1) {
      // 整组合并名都在集合中 → 保留合并名
      result.push(raw);
    } else {
      // 部分在集合中 → 拆开输出
      result.push(e);
    }
  }
  return result;
}

function diffItemSets(curr: NameItems, ref: NameItems): { added: string[]; removed: string[] } {
  const currSet = new Set(curr.expanded);
  const refSet = new Set(ref.expanded);
  const addedExp = curr.expanded.filter((e) => !refSet.has(e));
  const removedExp = ref.expanded.filter((e) => !currSet.has(e));

  const addedSet = new Set(addedExp);
  const removedSet = new Set(removedExp);

  const added = computeDiffNames(addedExp, addedSet, curr.rawMap);
  const removed = computeDiffNames(removedExp, removedSet, ref.rawMap);
  return { added, removed };
}

/**
 * 通用「双向集合变化」输出器：较少的一边在前，块内用「、」连接。
 */
function buildSetDiffBody(
  added: string,
  removed: string,
  addedCount: number,
  removedCount: number
): string {
  if (addedCount === 0) return `删除${removed}`;
  if (removedCount === 0) return `新增${added}`;
  if (addedCount <= removedCount) return `新增${added}，删除${removed}`;
  return `删除${removed}，新增${added}`;
}

// ============================================================
// 原子 diff（用于 normal 单元）
// ============================================================

function diffAtoms(curr: Atoms, ref: Atoms): string | null {
  // curr = desc1（当前/新），ref = desc2（对比/旧）
  // 统一输出「 ref → curr」

  const sameNumbers = numbersEqual(curr.numbers, ref.numbers);
  const sameTags = arraysEqual(curr.tags, ref.tags);
  const sameQuotes = arraysEqual(curr.quotes, ref.quotes);
  const sameLinks = linksEqual(curr.links, ref.links);
  const sameParens = arraysEqual(curr.parens, ref.parens);

  if (sameNumbers && sameTags && sameQuotes && sameLinks && sameParens) return null;

  // 问题 2：tag 不同 → 不做「…→…」，交由外层新增/删除
  if (!sameTags) return null;

  // 单一维度变化：numbers（保留 prefix/suffix；tag 提前；parens 相同则剔除）
  if (
    !sameNumbers &&
    curr.numbers.length === 1 &&
    ref.numbers.length === 1 &&
    sameQuotes &&
    sameLinks &&
    sameParens
  ) {
    const nCurr = curr.numbers[0]!;
    const nRef = ref.numbers[0]!;

    let oldText: string;
    let newText: string;
    if (nCurr.isDamage && nRef.isDamage) {
      // 伤害：保留 {数字*...} 完整形式，交由 TextWithHoverTooltips 渲染
      oldText = nRef.rawDamage ?? `${nRef.value}${nRef.unit}`;
      newText = nCurr.rawDamage ?? `${nCurr.value}${nCurr.unit}`;
    } else {
      oldText = `${nRef.sign}${nRef.value}${nRef.unit}`;
      newText = `${nCurr.sign}${nCurr.value}${nCurr.unit}`;
    }

    let prefix = curr.raw.slice(0, nCurr.start);
    let suffix = curr.raw.slice(nCurr.end);

    if (sameParens) {
      prefix = prefix.replace(/（[^）]*）/g, '');
      suffix = suffix.replace(/（[^）]*）/g, '');
    }

    let movedTag = '';
    for (const tag of curr.tags) {
      const tagStr = `{${tag}}`;
      if (suffix.startsWith(tagStr)) {
        movedTag = tagStr;
        suffix = suffix.slice(tagStr.length);
        break;
      }
    }
    // prefix 含 tag，或已把后缀 tag 提前 → 保持 prefix 原位
    const prefixHasTag = curr.tags.some((t) => prefix.includes(`{${t}}`));
    if (prefixHasTag || movedTag !== '') {
      return `${prefix}${movedTag}${oldText}→${newText}${suffix}`;
    }
    // 纯文本前缀（如「受到」「每秒受到」）→ 与旧值一起归入「…」块
    return `${prefix}${oldText}→${newText}${suffix}`;
  }

  // 单一维度变化：quotes
  if (
    !sameQuotes &&
    curr.quotes.length === 1 &&
    ref.quotes.length === 1 &&
    sameNumbers &&
    sameLinks &&
    sameParens
  ) {
    const qCurrStr = `“${curr.quotes[0]}”`;
    const qRefStr = `“${ref.quotes[0]}”`;
    const idxCurr = curr.raw.indexOf(qCurrStr);
    const idxRef = ref.raw.indexOf(qRefStr);
    if (idxCurr !== -1 && idxRef !== -1) {
      const prefixCurr = curr.raw.slice(0, idxCurr);
      const suffixCurr = curr.raw.slice(idxCurr + qCurrStr.length);
      const prefixRef = ref.raw.slice(0, idxRef);
      const suffixRef = ref.raw.slice(idxRef + qRefStr.length);

      // 前后缀完全相同
      if (prefixCurr === prefixRef && suffixCurr === suffixRef) {
        return `${prefixCurr}${qRefStr}（原）→${qCurrStr}（新）${suffixCurr}`;
      }

      // 前后缀不同 → 原位替换
      return (
        curr.raw.slice(0, idxCurr) +
        `${qRefStr}→${qCurrStr}` +
        curr.raw.slice(idxCurr + qCurrStr.length)
      );
    }
    return `${qRefStr}→${qCurrStr}`;
  }

  // 单一维度变化：parens（注释本身变化时才出现）
  if (
    !sameParens &&
    curr.parens.length === 1 &&
    ref.parens.length === 1 &&
    sameNumbers &&
    sameQuotes &&
    sameLinks
  ) {
    const pCurrStr = `（${curr.parens[0]}）`;
    const pRefStr = `（${ref.parens[0]}）`;
    const idx = curr.raw.indexOf(pCurrStr);
    if (idx !== -1) {
      return (
        curr.raw.slice(0, idx) + `${pRefStr}→${pCurrStr}` + curr.raw.slice(idx + pCurrStr.length)
      );
    }
    return `${pRefStr}→${pCurrStr}`;
  }

  // 单一维度变化：links
  if (
    !sameLinks &&
    curr.links.length === 1 &&
    ref.links.length === 1 &&
    sameNumbers &&
    sameQuotes &&
    sameParens
  ) {
    const lCurr = curr.links[0]!;
    const lRef = ref.links[0]!;
    const lCurrStr = `[${lCurr.text}](${lCurr.note})`;
    const lRefStr = `[${lRef.text}](${lRef.note})`;
    const idx = curr.raw.indexOf(lCurrStr);
    if (idx !== -1) {
      return (
        curr.raw.slice(0, idx) + `${lRefStr}→${lCurrStr}` + curr.raw.slice(idx + lCurrStr.length)
      );
    }
    return `${lRefStr}→${lCurrStr}`;
  }

  // 组合变化
  return `${ref.raw}→${curr.raw}`;
}

/**
 * 字段身份签名：tags + links.text。
 * 不含 numbers、quotes、parens、links.note，用于区分「同一字段的不同取值」与「不同字段」。
 * - quotes / parens 是「同一字段内的具名实体或注释」，允许在步骤 2 内做单维度替换；
 * - tags 是字段实体本身，不同即视为不同字段，走新增/删除。
 */
function identityKey(atoms: Atoms): string {
  return [atoms.tags.join('\u0001'), atoms.links.map((l) => l.text).join('\u0001')].join('\u0002');
}

// ============================================================
// normal 单元匹配
// ============================================================

function matchNormalUnits(units1: Unit[], units2: Unit[]): string[] {
  const changes: string[] = [];

  const map2 = new Map<string, Unit[]>();
  for (const u of units2) {
    const key = u.atoms?.skeleton ?? u.text;
    const list = map2.get(key) ?? [];
    list.push(u);
    map2.set(key, list);
  }

  const unmatchedCurr: Unit[] = [];

  // 步骤 1：raw 完全相同
  for (const u1 of units1) {
    const key = u1.atoms?.skeleton ?? u1.text;
    const list = map2.get(key);
    if (list) {
      const idx = list.findIndex((u) => u.atoms?.raw === u1.atoms?.raw);
      if (idx !== -1) {
        list.splice(idx, 1);
        if (list.length === 0) map2.delete(key);
        continue;
      }
    }
    unmatchedCurr.push(u1);
  }

  const stillUnmatched: Unit[] = [];

  // 步骤 2：identity 相同（tags/quotes/parens/links.text 相同）→ 值变化
  for (const u1 of unmatchedCurr) {
    const key = u1.atoms?.skeleton ?? u1.text;
    const list = map2.get(key);
    if (list) {
      const id1 = identityKey(u1.atoms!);
      const idx = list.findIndex((u) => identityKey(u.atoms!) === id1);
      if (idx !== -1) {
        const u2 = list.splice(idx, 1)[0]!;
        if (list.length === 0) map2.delete(key);
        const diff = diffAtoms(u1.atoms!, u2.atoms!);
        if (diff) changes.push(diff);
        continue;
      }
    }
    stillUnmatched.push(u1);
  }

  const addedRaws: string[] = [];
  const removedRaws: string[] = [];

  // 步骤 3：结构相似且 tags 相同 → 整体替换
  // 问题 2：tags 不同不配对，落到新增/删除
  for (const u1 of stillUnmatched) {
    const key = u1.atoms?.skeleton ?? u1.text;
    const list = map2.get(key);
    let matched = false;

    if (list) {
      const a1 = u1.atoms!;
      const idx = list.findIndex((u2) => {
        const a2 = u2.atoms!;
        if (!arraysEqual(a1.tags, a2.tags)) return false;
        if (a2.quotes.length !== a1.quotes.length) return false;
        if (a2.parens.length !== a1.parens.length) return false;
        if (a2.numbers.length !== a1.numbers.length) return false;
        if (a2.links.length !== a1.links.length) return false;
        const quoteSet = new Set(a2.quotes);
        if (a1.quotes.some((q) => quoteSet.has(q))) return false;
        return true;
      });

      if (idx !== -1) {
        const u2 = list.splice(idx, 1)[0]!;
        if (list.length === 0) map2.delete(key);
        changes.push(`${u2.atoms!.raw}→${u1.atoms!.raw}`);
        matched = true;
      }
    }

    if (!matched) addedRaws.push(u1.raw);
  }

  for (const [, list] of map2) {
    for (const u of list) removedRaws.push(u.raw);
  }
  map2.clear();

  if (addedRaws.length > 0) {
    changes.push(addedRaws.map((t) => `新增${t}`).join('；'));
  }
  if (removedRaws.length > 0) {
    changes.push(removedRaws.map((t) => `删除${t}`).join('；'));
  }

  return changes;
}

// ============================================================
// 特殊分类聚合
// ============================================================

function partitionImmuneClear(units: Unit[]): Map<string, ImmuneClear[]> {
  const map = new Map<string, ImmuneClear[]>();
  for (const u of units) {
    if (u.kind !== 'immuneClear' || !u.ic) continue;
    const key = `${u.ic.direction}-${u.ic.action}`;
    const bucket = map.get(key) ?? [];
    bucket.push(u.ic);
    map.set(key, bucket);
  }
  return map;
}

function aggregateItems(list: ImmuneClear[]): NameItems {
  const expanded: string[] = [];
  const rawMap = new Map<string, string>();
  for (const ic of list) {
    for (const e of ic.items.expanded) {
      if (!rawMap.has(e)) {
        expanded.push(e);
        rawMap.set(e, ic.items.rawMap.get(e) ?? e);
      }
    }
  }
  return { expanded, rawMap };
}

function getICLabel(key: string): string {
  const [dir, act] = key.split('-');
  const dirLabel = dir === 'self' ? '' : '被';
  const actLabel = act === 'immune' ? '免疫' : '清除';
  return `${dirLabel}${actLabel}列表变化`;
}

// ============================================================
// 主入口
// ============================================================

export function compareBuffDescriptions(desc1: string, desc2: string, name2: string): string {
  const p1 = parseDescription(desc1);
  const p2 = parseDescription(desc2);
  if (!p1 || !p2) return '';

  const units1 = splitToUnits(p1.body);
  const units2 = splitToUnits(p2.body);

  // 分类收集
  const group1 = units1.find((u) => u.kind === 'group');
  const group2 = units2.find((u) => u.kind === 'group');
  const helpful1 = units1.find((u) => u.kind === 'helpful');
  const helpful2 = units2.find((u) => u.kind === 'helpful');

  const normal1 = units1.filter((u) => u.kind === 'normal');
  const normal2 = units2.filter((u) => u.kind === 'normal');

  const ic1Map = partitionImmuneClear(units1);
  const ic2Map = partitionImmuneClear(units2);

  // 按计划输出顺序收集
  const result: string[] = [];

  // 1) normal（数值/标签/引号/注释/新增/删除）
  const normalChanges = matchNormalUnits(normal1, normal2);
  for (const c of normalChanges) result.push(c);

  // 2) 免疫/清除四类
  const icOrder: string[] = ['self-clear', 'self-immune', 'passive-clear', 'passive-immune'];
  for (const key of icOrder) {
    const items1 = aggregateItems(ic1Map.get(key) ?? []);
    const items2 = aggregateItems(ic2Map.get(key) ?? []);
    const { added, removed } = diffItemSets(items1, items2);
    if (added.length === 0 && removed.length === 0) continue;
    const addedStr = added.map((n) => `“${n}”`).join('、');
    const removedStr = removed.map((n) => `“${n}”`).join('、');
    const body = buildSetDiffBody(addedStr, removedStr, added.length, removed.length);
    result.push(`[${getICLabel(key)}](${body})`);
  }

  // 3) 隶属分组
  const groups1 = group1?.groups ?? [];
  const groups2 = group2?.groups ?? [];
  const addedGroups = groups1.filter((g) => !groups2.includes(g));
  const removedGroups = groups2.filter((g) => !groups1.includes(g));
  if (addedGroups.length > 0 || removedGroups.length > 0) {
    const addedStr = addedGroups.map((g) => `分组${g}`).join('、');
    const removedStr = removedGroups.map((g) => `分组${g}`).join('、');
    const body = buildSetDiffBody(addedStr, removedStr, addedGroups.length, removedGroups.length);
    result.push(`隶属分组${body}`);
  }

  // 4) helpful
  if (helpful1 && helpful2) {
    if (helpful1.helpful !== helpful2.helpful) {
      result.push(`${helpful2.text}→${helpful1.text}`);
    }
  } else if (helpful1) {
    result.push(`新增${helpful1.text}`);
  } else if (helpful2) {
    result.push(`删除${helpful2.text}`);
  }

  const processedContent = result.join('；');
  if (!processedContent) return '';

  return `${p1.nameDisplay}：相比“${name2}”：${processedContent}。`;
}
