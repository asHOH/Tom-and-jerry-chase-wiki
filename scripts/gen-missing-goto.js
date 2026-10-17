/**
 * gen-missing-goto.js — 为站内链接到但静态导出中缺失的 /goto/<name>/ 生成跳转页。
 * 用 jiti 调用项目的 getGotoResult 解析目标，生成 meta refresh + 链接的静态页。
 * 在 tjwiki-src 目录内运行: node scripts/gen-missing-goto.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createJiti } from 'jiti';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
nextEnv.loadEnvConfig(projectRoot);

// next.config.ts 在构建时嵌入的构建标识；此脚本复用同一标识以读取静态 artifact
process.env.TJWIKI_BUILD_IDENTITY =
  process.env.TJWIKI_BUILD_IDENTITY || process.env.DEPLOY_BUILD_ID || 'tjwiki-static-mirror';

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.join(projectRoot, 'src'),
    'server-only': path.join(projectRoot, 'scripts/lib/server-only-stub.mjs'),
  },
});

const ROOT = path.resolve(projectRoot, '..', 'tjwiki-static');

// 1. 扫描全站 /goto/ 链接
const names = new Map();
(function walk(d, depth = 0) {
  if (depth > 4) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name.endsWith('.html')) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/href="\/goto\/([^"/]+)\/?"/g)) {
        const enc = m[1];
        if (!names.has(enc)) names.set(enc, decodeURIComponent(enc));
      }
    }
  }
})(ROOT);

console.log('goto links found:', names.size);

const missing = [...names.entries()].filter(
  ([, name]) => !fs.existsSync(path.join(ROOT, 'goto', name, 'index.html'))
);
console.log('missing goto pages:', missing.length);

if (missing.length > 0) {
  const { getGotoResult } = await jiti('../src/lib/gotoUtils.ts');

  const template = fs.readFileSync(path.join(ROOT, 'recent-changes/index.html'), 'utf8');
  const mainStart = template.indexOf('<main');
  const mainEnd = template.indexOf('</main>') + 7;
  const mainBlock = template.slice(mainStart, mainEnd);

  let made = 0;
  let unresolved = 0;
  const resolveName = async (raw) => {
    // 依次尝试：原名 → 去掉“N级”前缀 → 去掉括号后缀
    const candidates = [raw];
    const noLevel = raw.replace(/^\d+级/, '');
    if (noLevel !== raw) candidates.push(noLevel);
    const noParen = raw.replace(/[（(][^（）()]*[)）]$/, '');
    if (noParen !== raw) candidates.push(noParen);
    for (const c of candidates) {
      if (!c.trim()) continue;
      try {
        const result = await getGotoResult(c);
        if (result && result.type !== 'disambiguation') return result.url;
        if (result && result.type === 'disambiguation') return result.candidates?.[0]?.url ?? null;
      } catch (e) {
        /* ignore */
      }
    }
    return null;
  };
  for (const [, name] of missing) {
    const target = await resolveName(name);
    if (!target) {
      unresolved++;
      console.log('  unresolved:', name);
      continue;
    }
    const newMain = mainBlock
      .replace(
        /<h1[^>]*>[\s\S]*?<\/h1>/,
        `<h1 class="text-foreground text-2xl font-bold sm:text-3xl">正在跳转：${name}</h1>`
      )
      .replace(/最近更改/g, name)
      .replace(
        /<p>当前为离线静态镜像版本[\s\S]*?<\/p>\s*<p>游戏数据内容[\s\S]*?<\/p>/,
        `<p>跳转目标：<a class="text-blue-600 underline" href="${target}">${target}</a></p>`
      );
    let html = template.slice(0, mainStart) + newMain + template.slice(mainEnd);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${name} - 猫鼠百科</title>`);
    html = html.replace(
      '<head>',
      `<head><meta http-equiv="refresh" content="0; url=${encodeURI(target)}"/>`
    );
    const out = path.join(ROOT, 'goto', name, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html, 'utf8');
    made++;
  }
  console.log('created goto pages:', made, '| unresolved:', unresolved);
}
