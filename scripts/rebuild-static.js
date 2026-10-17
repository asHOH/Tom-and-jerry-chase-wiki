#!/usr/bin/env node
/**
 * rebuild-static.js — 一条命令完成「源码 → 可部署静态包」的完整流水线。
 *
 * 前置：已执行 next build（产出 out/）
 * 步骤：
 *   1. 复制 out/ → ../tjwiki-static/（保留 .htaccess / README / serve.js / 占位页）
 *   2. postprocess-export.js  无 JS 可读化（去骨架屏、合并隐藏内容）
 *   3. compress-images-extreme.js  图片极限压缩（从 public/images 原图重编码）
 *   4. 删除预取冗余载荷（__next._full.txt / __next._tree.txt / __next.!*）
 *   5. 重新打包 UTF-8 ZIP
 *
 * 用法: node scripts/rebuild-static.js
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = path.join(projectRoot, 'out');
const SITE = path.resolve(projectRoot, '..', 'tjwiki-static');
const ZIP = path.resolve(projectRoot, '..', 'tjwiki-static.zip');

const step = (msg) => console.log('\n=== ' + msg + ' ===');
const mb = (v) => (v / 1048576).toFixed(1) + 'MB';

function sizeOf(dir) {
  let total = 0;
  let files = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        total += fs.statSync(p).size;
        files++;
      }
    }
  })(dir);
  return { total, files };
}

// ---- 1. 复制（保住 .htaccess） ----
step('复制 out/ → tjwiki-static/');
const htaccess = path.join(SITE, '.htaccess');
const htaccessBak = path.join(SITE, '.htaccess.keep');
if (fs.existsSync(htaccess)) fs.renameSync(htaccess, htaccessBak);
execFileSync('cp', ['-r', OUT + '/.', SITE + '/'], { stdio: 'inherit' });
if (fs.existsSync(htaccessBak)) fs.renameSync(htaccessBak, htaccess);
console.log('复制完成，.htaccess 已保留');

// ---- 2. 无 JS 可读化 ----
step('后处理：去骨架屏 / 合并隐藏内容');
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/postprocess-export.cjs'), SITE], {
  stdio: 'inherit',
});

// ---- 3. 图片极限压缩 ----
step('图片极限压缩');
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/compress-images-extreme.cjs')], {
  stdio: 'inherit',
});

// ---- 4. 删除预取冗余 ----
step('清理预取冗余载荷');
const before = sizeOf(SITE);
const bash = process.env.CODEBUDDY_CODE_GIT_BASH_PATH
  ? path.join(path.dirname(process.env.CODEBUDDY_CODE_GIT_BASH_PATH), 'bash.exe')
  : 'bash';
try {
  execFileSync(
    bash,
    [
      '-lc',
      `cd "${SITE}" && find . \\( -name '__next._full.txt' -o -name '__next._tree.txt' \\) -delete && find . -depth -name '__next.!*' -exec rm -rf {} + 2>/dev/null; true`,
    ],
    {
      stdio: 'inherit',
    }
  );
} catch (e) {
  console.log('清理命令返回非零（可忽略）:', String(e.message).slice(0, 120));
}
const after = sizeOf(SITE);
console.log(
  `文件数 ${before.files} → ${after.files} | 体积 ${mb(before.total)} → ${mb(after.total)}`
);

// ---- 5. 打包 ----
step('打包 UTF-8 ZIP');
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/make-zip.cjs'), SITE, ZIP], {
  stdio: 'inherit',
});

step('完成');
console.log('站点目录:', SITE, '|', mb(after.total), after.files + ' 文件');
console.log('部署包  :', ZIP, '|', mb(fs.statSync(ZIP).size));
