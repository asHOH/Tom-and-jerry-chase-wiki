#!/usr/bin/env node
/**
 * compress-images-extreme.js — 第二轮极限压缩。
 * 从「原始源图」public/images 重新编码（避免对已压图二次量化），写入交付目录 tjwiki-static/images。
 * macOS/Windows 通用，依赖项目内 sharp。
 *
 * 用法: node scripts/compress-images-extreme.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.resolve(__dirname, '..', 'public', 'images');
const OUT = path.resolve(__dirname, '..', '..', 'tjwiki-static', 'images');

// 长边上限（按页面实际渲染尺寸 × 2~3 倍 DPR 设定）
const CAPS = {
  specialCharacters: 560,
  maps: 512,
  cats: 448,
  mice: 448,
  entities: 288,
  fixtures: 224,
  items: 224,
  buffs: 224,
  catCards: 224,
  mouseCards: 224,
  catSkills: 112,
  mouseSkills: 112,
  entitySkills: 112,
  catSpecialSkills: 88,
  mouseSpecialSkills: 88,
  icons: 88,
  modes: 88,
  articles: 640,
  misc: 224,
};
const DEFAULT_CAP = 288;

const ENC = {
  png: { palette: true, quality: 50, colours: 64, compressionLevel: 9, effort: 10 },
  webp: { quality: 55, effort: 6, alphaQuality: 60, smartSubsample: true },
  avif: { quality: 42, effort: 6, chromaSubsampling: '4:2:0' },
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.png')) out.push(p);
  }
  return out;
}

(async () => {
  const pngs = walk(SRC);
  const t0 = Date.now();
  let done = 0;
  let failed = 0;
  let bytes = 0;
  let idx = 0;
  const CONC = 6;

  async function worker() {
    while (idx < pngs.length) {
      const png = pngs[idx++];
      const rel = path.relative(SRC, png);
      const cat = rel.split(path.sep)[0];
      const cap = CAPS[cat] || DEFAULT_CAP;
      try {
        const meta = await sharp(png).metadata();
        const w = meta.width || cap;
        const h = meta.height || cap;
        const scale = Math.min(1, cap / Math.max(w, h));
        const pipeline = sharp(png).resize({
          width: Math.max(1, Math.round(w * scale)),
          height: Math.max(1, Math.round(h * scale)),
          fit: 'inside',
          withoutEnlargement: true,
          kernel: 'lanczos3',
        });
        const [pngBuf, webpBuf, avifBuf] = await Promise.all([
          pipeline.clone().png(ENC.png).toBuffer(),
          pipeline.clone().webp(ENC.webp).toBuffer(),
          pipeline.clone().avif(ENC.avif).toBuffer(),
        ]);
        const outPng = path.join(OUT, rel);
        const base = outPng.slice(0, -4);
        fs.mkdirSync(path.dirname(outPng), { recursive: true });
        fs.writeFileSync(outPng, pngBuf);
        fs.writeFileSync(base + '.webp', webpBuf);
        fs.writeFileSync(base + '.avif', avifBuf);
        bytes += pngBuf.length + webpBuf.length + avifBuf.length;
      } catch (e) {
        failed++;
        console.log('  !! failed:', rel, e.message.slice(0, 80));
      }
      done++;
      if (done % 150 === 0) {
        console.log(
          '  ... ' + done + '/' + pngs.length + ' (' + Math.round((Date.now() - t0) / 1000) + 's)'
        );
      }
    }
  }

  console.log('源图:', pngs.length, '张 | 目标:', OUT);
  await Promise.all(Array.from({ length: CONC }, worker));

  const total = fs
    .readdirSync(OUT, { recursive: true })
    .filter((f) => /\.(png|webp|avif)$/i.test(f))
    .reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);

  console.log('\n输出总大小: ' + (total / 1048576).toFixed(2) + 'MB');
  console.log('失败:', failed, '| 耗时:', Math.round((Date.now() - t0) / 1000) + 's');
})();
