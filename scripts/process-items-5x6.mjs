#!/usr/bin/env node
// Pad PNGs in public/images/items to 5:6 by enlarging canvas only.
// Keeps original image bottom-center on a transparent background.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ITEMS_DIR = path.resolve('public/images/items');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Compute minimal 5:6 canvas that can contain (w,h) without scaling.
 * Returns {W,H,left,top}. Image should be placed at (left, top) on the canvas.
 * bottom-center placement => left = floor((W - w)/2), top = H - h
 */
function computeCanvasAndPlacement(w, h) {
  // Target ratio W:H = 5:6
  const targetH = Math.max(h, Math.ceil((6 * w) / 5));
  const targetW = Math.ceil((5 * targetH) / 6);
  const left = Math.floor((targetW - w) / 2);
  const top = targetH - h; // bottom aligned
  return { W: targetW, H: targetH, left, top };
}

async function main() {
  const start = Date.now();
  const entries = await fs.readdir(ITEMS_DIR, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => /\.png$/i.test(n));

  if (pngFiles.length === 0) {
    console.log('[items 5:6] No PNG files found. Nothing to do.');
    return;
  }

  /** @type {Array<{file:string,width:number,height:number}>} */
  const exceptionallyWide = [];
  let skipped = 0;
  let processed = 0;

  for (const name of pngFiles) {
    const filePath = path.join(ITEMS_DIR, name);
    try {
      const img = sharp(filePath, { failOn: 'none' });
      const meta = await img.metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (!w || !h) {
        console.warn(`[items 5:6] Skip (no dimensions): ${name}`);
        skipped++;
        continue;
      }

      if (w > 750) {
        exceptionallyWide.push({ file: name, width: w, height: h });
      }

      // If already exactly 5:6, skip processing
      if (6 * w === 5 * h) {
        skipped++;
        continue;
      }

      const { W, H, left, top } = computeCanvasAndPlacement(w, h);

      // Read original to buffer to avoid read/write race on same path
      const originalBuffer = await img.png().toBuffer();

      const bg = sharp({
        create: {
          width: W,
          height: H,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

      // Write to a temporary file then atomically replace the original to avoid Windows write locks
      const tmpPath = filePath + '.tmp-5x6.png';
      await bg
        .composite([{ input: originalBuffer, left, top }])
        .png()
        .toFile(tmpPath);

      // Robust replace with retries to handle Windows locks
      const MAX_RETRIES = 5;
      let replaced = false;
      for (let attempt = 1; attempt <= MAX_RETRIES && !replaced; attempt++) {
        try {
          await fs.chmod(filePath, 0o666);
        } catch {}
        try {
          await fs.rm(filePath, { force: true });
        } catch {}
        try {
          await fs.rename(tmpPath, filePath);
          replaced = true;
        } catch {
          try {
            await fs.copyFile(tmpPath, filePath);
            await fs.rm(tmpPath, { force: true });
            replaced = true;
          } catch {
            try {
              await fs.chmod(filePath, 0o666);
            } catch {}
            if (attempt === MAX_RETRIES) throw new Error('replace failed after retries');
            await sleep(150 * attempt); // incremental backoff
          }
        }
      }

      processed++;
    } catch (err) {
      console.error(`[items 5:6] Error processing ${name}:`, err?.message || err);
      // Best-effort cleanup of tmp file if left behind
      try {
        await fs.rm(filePath + '.tmp-5x6.png', { force: true });
      } catch {}
      skipped++;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n[items 5:6] Done in ${elapsed}s`);
  console.log(`[items 5:6] Total PNGs: ${pngFiles.length}`);
  console.log(`[items 5:6] Processed (padded): ${processed}`);
  console.log(`[items 5:6] Skipped (already 5:6 or errored): ${skipped}`);

  if (exceptionallyWide.length) {
    console.log('\n[items 5:6] Exceptionally wide images (width > 750):');
    for (const it of exceptionallyWide) {
      console.log(`- ${it.file} (${it.width}x${it.height})`);
    }
  } else {
    console.log('\n[items 5:6] No images wider than 750px found.');
  }
}

main().catch((e) => {
  console.error('[items 5:6] Fatal error:', e);
  process.exitCode = 1;
});
