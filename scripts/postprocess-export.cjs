#!/usr/bin/env node
/**
 * postprocess-export.js — 让 Next 静态导出的页面无 JS 也能直接展示真实内容。
 *
 * Next 静态导出对 Suspense 边界的输出形态（两种）：
 *   A. 骨架态：  [fallback 骨架] <div hidden id="S:N">[真实内容]</div> <script>$RC(...)</script>
 *   B. 已解析：  <!--$-->[真实内容内联]<!--/$-->
 * 本脚本用 htmlparser2（带位置）分析 DOM，再对原始字符串做区间 splicing（不重新序列化，
 * 因此 RSC payload / script / style 等内容字节不变）：
 *   1. 真实 S:N 内容合并到对应 <template id="B:N"> 位置；删除 S:N 外壳与 $RC 脚本
 *   2. 由内向外处理边界区间：
 *      - 含合并锚点 → 保留锚点，删除区间其余部分
 *      - 含骨架标记 → 整段删除（fallback）
 *      - 其余（已解析的内联内容/空区间）→ 仅删除首尾标记注释，保留内容
 *   3. 清扫所有残留的边界标记注释
 *   4. 去掉残留 hidden 属性
 * 用法: node postprocess-export.js <目录>
 */
const fs = require('fs');
const path = require('path');
const { parseDocument } = require('htmlparser2');

const SKELETON_MARKS = ['animate-pulse', 'skeleton-shimmer', '正在加载页面'];
const OPEN_MARKERS = new Set(['$', '$?', '$!']);
const MARKER_COMMENT_RE = /<!--\$[!?]?-->|<!--\/\$-->/g;

function stripMarkerComments(html) {
  return html.replace(MARKER_COMMENT_RE, '');
}

function isSkeletonHtml(html) {
  return SKELETON_MARKS.some((m) => html.includes(m));
}

function collect(node, html, out) {
  if (node.type === 'tag') {
    const attribs = node.attribs || {};
    if (attribs.hidden !== undefined && /^S:\d+$/.test(attribs.id || '')) {
      out.sDivs.push({ n: attribs.id, start: node.startIndex, end: node.endIndex });
    }
    if (node.name === 'template' && /^B:\d+$/.test(attribs.id || '')) {
      out.templates.push({ n: attribs.id, start: node.startIndex, end: node.endIndex });
    }
    if (node.name === 'script') {
      const text = (node.children || []).map((c) => c.data || '').join('');
      if (/^\s*\$RC\(/.test(text))
        out.rcScripts.push({ start: node.startIndex, end: node.endIndex });
    }
  }
  if (node.type === 'comment') {
    const d = (node.data || '').trim();
    if (OPEN_MARKERS.has(d) || d === '/$') {
      out.markers.push({ pos: node.startIndex, end: node.endIndex, type: d });
    }
  }
  for (const c of node.children || []) collect(c, html, out);
}

/** 删除 [start,end) 但避开其中的 keep 区间 */
function deleteAroundKeeps(start, end, keeps, edits) {
  const inner = keeps.filter(([a, b]) => a >= start && b <= end).sort((x, y) => x[0] - y[0]);
  if (inner.length === 0) {
    edits.push({ start, end, replacement: '' });
    return;
  }
  let cursor = start;
  for (const [a, b] of inner) {
    if (a > cursor) edits.push({ start: cursor, end: a, replacement: '' });
    cursor = Math.max(cursor, b);
  }
  if (cursor < end) edits.push({ start: cursor, end, replacement: '' });
}

function transform(html) {
  const dom = parseDocument(html, { withStartIndices: true, withEndIndices: true });
  const found = { sDivs: [], templates: [], rcScripts: [], markers: [] };
  collect(dom, html, found);
  if (!found.sDivs.length && !found.markers.length) return html;

  // ---- 边界区间（深度追踪，保留首尾标记对象） ----
  const marks = found.markers.slice().sort((a, b) => a.pos - b.pos);
  const ranges = [];
  {
    let depth = 0;
    let open = null;
    for (const mk of marks) {
      if (OPEN_MARKERS.has(mk.type)) {
        depth++;
        if (depth === 1) open = mk;
      } else {
        depth--;
        if (depth === 0 && open) {
          ranges.push({ open, close: mk, start: open.pos, end: mk.end });
          open = null;
        }
        if (depth < 0) depth = 0;
      }
    }
  }

  // ---- S div 信息 ----
  const sDivInfo = new Map();
  for (const sd of found.sDivs) {
    const tagMatch = /^<div[^>]*>/.exec(html.slice(sd.start, sd.start + 300));
    const tagLen = tagMatch ? tagMatch[0].length : 0;
    const inner = html.slice(sd.start + tagLen, sd.end - 6);
    sDivInfo.set(sd.n, { sd, tagLen, inner, isSkeleton: isSkeletonHtml(inner) });
  }
  const templateByN = new Map(found.templates.map((t) => [t.n, t]));

  const edits = [];
  const keeps = [];

  // ---- 1) S div 处理 ----
  for (const [n, info] of sDivInfo) {
    const tmpl = templateByN.get('B:' + n.slice(2));
    if (!info.isSkeleton && tmpl) {
      // 真实内容合并进 template 位置（剥掉内容内联的边界标记），再删掉 S:N 外壳（避开内部 keep）
      edits.push({
        start: tmpl.start,
        end: tmpl.end,
        replacement: stripMarkerComments(info.inner),
      });
      keeps.push([tmpl.start, tmpl.end]);
      deleteAroundKeeps(info.sd.start, info.sd.end, keeps, edits);
    } else {
      // 无 template 的真实内容：解壳保留；骨架：仅删壳（内部交给边界规则）
      edits.push({ start: info.sd.start, end: info.sd.start + info.tagLen, replacement: '' });
      edits.push({ start: info.sd.end - 6, end: info.sd.end, replacement: '' });
      if (!info.isSkeleton) keeps.push([info.sd.start + info.tagLen, info.sd.end - 6]);
    }
  }

  // ---- 2) $RC 切换脚本 ----
  for (const rc of found.rcScripts) edits.push({ start: rc.start, end: rc.end, replacement: '' });

  // ---- 3) 边界区间（内层优先） ----
  const sortedRanges = ranges.slice().sort((a, b) => a.end - a.start - (b.end - b.start));
  for (const r of sortedRanges) {
    const innerKeeps = keeps.filter(([a, b]) => a >= r.start && b <= r.end);
    if (innerKeeps.length) {
      deleteAroundKeeps(r.start, r.end, keeps, edits);
    } else if (isSkeletonHtml(html.slice(r.start, r.end))) {
      edits.push({ start: r.start, end: r.end, replacement: '' });
    } else {
      // 已解析的内联内容 / 空区间：仅删除首尾标记
      edits.push({ start: r.open.pos, end: r.open.end, replacement: '' });
      edits.push({ start: r.close.pos, end: r.close.end, replacement: '' });
    }
  }

  // ---- 4) 清扫残留标记 ----
  for (const mk of marks) edits.push({ start: mk.pos, end: mk.end, replacement: '' });

  // ---- 重叠解决：跳过被覆盖的编辑 ----
  edits.sort((a, b) => a.start - b.start || b.end - a.end);
  const resolved = [];
  let lastEnd = -1;
  for (const e of edits) {
    if (e.start < lastEnd) continue;
    resolved.push(e);
    lastEnd = e.end;
  }

  // ---- 由后向前应用 ----
  let out = html;
  for (let i = resolved.length - 1; i >= 0; i--) {
    const e = resolved[i];
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }

  // ---- 5) 去掉残留 hidden ----
  out = out.replace(/<div hidden(?:=""| id="S:\d+")>/g, (mm) => {
    const idm = mm.match(/id="S:\d+"/);
    return idm ? `<div ${idm[0]}>` : '<div>';
  });

  return out;
}

function divBalance(html) {
  return (html.match(/<div\b/g) || []).length - (html.match(/<\/div>/g) || []).length;
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node postprocess-export.js <dir>');
    process.exit(1);
  }
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) files.push(p);
    }
  })(dir);

  console.log('html files:', files.length);
  let changed = 0;
  let drift = 0;
  let skeletonLeft = 0;
  let markerLeft = 0;
  const t0 = Date.now();
  files.forEach((f, i) => {
    const html = fs.readFileSync(f, 'utf8');
    const outHtml = transform(html);
    if (divBalance(html) !== divBalance(outHtml)) {
      drift++;
      if (drift <= 5) console.log('  !! div balance drift:', path.relative(dir, f));
    }
    const noScript = outHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    if (isSkeletonHtml(noScript)) {
      skeletonLeft++;
      if (skeletonLeft <= 5) console.log('  !! visible skeleton:', path.relative(dir, f));
    }
    if (/<!--\$/.test(noScript)) {
      markerLeft++;
      if (markerLeft <= 5) console.log('  !! marker left:', path.relative(dir, f));
    }
    if (outHtml !== html) {
      fs.writeFileSync(f, outHtml, 'utf8');
      changed++;
    }
    if ((i + 1) % 500 === 0)
      console.log(
        '  ...',
        i + 1,
        '/',
        files.length,
        '(' + Math.round((Date.now() - t0) / 1000) + 's)'
      );
  });
  console.log(
    'transformed:',
    changed,
    '| balance drift:',
    drift,
    '| visible skeleton:',
    skeletonLeft,
    '| markers left:',
    markerLeft
  );
  console.log('elapsed:', Math.round((Date.now() - t0) / 1000) + 's');
}

main();
