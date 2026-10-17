/**
 * inject-statement.js — 直接向已编译产物注入「静态版本说明」。
 * 改动三处（均带匹配次数校验，失败即回滚）：
 *   1. usages/index.html      「网站说明」栏目页，header 内追加一段
 *   2. index.html             首页「网站说明」区块开头追加一段
 *   3. _next/.../*.js         客户端文案 maintainerPrefix，保证 SPA 导航回首页时也显示
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', 'tjwiki-static');
const NAME = '九归零';
const TEXT =
  '本站整站静态页面由 九归零 编译制作，项目位于官方项目的一条分支上。部署或分发此版本时，请一并附带本说明。';

const backups = [];
function patch(file, find, replace, label) {
  const abs = path.join(ROOT, file);
  const src = fs.readFileSync(abs, 'utf8');
  const count = src.split(find).length - 1;
  if (count !== 1) throw new Error(`${label}: 期望匹配 1 次，实际 ${count} 次 (${file})`);
  backups.push([abs, src]);
  fs.writeFileSync(abs, src.replace(find, replace), 'utf8');
  console.log(`  ✓ ${label} (${file})`);
}

try {
  console.log('注入静态版本说明…');

  // ---- 1. /usages/ 「网站说明」栏目页 ----
  patch(
    'usages/index.html',
    '本网站的使用指南</p></div></header>',
    `本网站的使用指南</p></div><p class="mx-auto max-w-3xl py-1 text-base leading-8 text-gray-600 transition-colors md:py-2 dark:text-gray-300">本站整站静态页面由 <strong class="font-semibold text-gray-900 dark:text-gray-100">${NAME}</strong> 编译制作，项目位于官方项目的一条分支上。部署或分发此版本时，请一并附带本说明。</p></header>`,
    '栏目页说明'
  );

  // ---- 2. 首页「网站说明」区块 ----
  patch(
    'index.html',
    '<div class="space-y-4 text-left"><section aria-label="项目信息">',
    `<div class="space-y-4 text-left"><section aria-label="静态版本说明"><p class="text-gray-700 dark:text-gray-300">本站整站静态页面由 <strong class="font-semibold text-gray-900 dark:text-gray-100">${NAME}</strong> 编译制作，项目位于官方项目的一条分支上。部署或分发此版本时，请一并附带本说明。</p></section><section aria-label="项目信息">`,
    '首页区块说明'
  );

  // ---- 3. 客户端 chunk：拼进 maintainerPrefix ----
  const chunksDir = path.join(ROOT, '_next/static/chunks');
  const target = fs
    .readdirSync(chunksDir)
    .filter((f) => f.endsWith('.js'))
    .find((f) =>
      fs.readFileSync(path.join(chunksDir, f), 'utf8').includes('maintainerPrefix:"本项目由"')
    );
  if (!target) throw new Error('未找到包含 maintainerPrefix 的 chunk');
  patch(
    `_next/static/chunks/${target}`,
    'maintainerPrefix:"本项目由"',
    `maintainerPrefix:"${TEXT}本项目由"`,
    '客户端文案'
  );

  console.log('\n全部注入完成。');
  console.log('说明文案：' + TEXT);
} catch (e) {
  console.error('\n失败，回滚：' + e.message);
  for (const [abs, content] of backups) fs.writeFileSync(abs, content, 'utf8');
  process.exit(1);
}
