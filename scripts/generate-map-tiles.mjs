import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [, , sourceArg, mapIdArg, outputArg] = process.argv;

if (!sourceArg || !mapIdArg) {
  console.error(
    '用法: npm run generate:map-tiles -- <源图片> <地图标识> [输出目录，默认 public/images/map-tiles]'
  );
  process.exit(1);
}

const source = path.resolve(sourceArg);
const outputRoot = path.resolve(outputArg ?? 'public/images/map-tiles');
const outputDirectory = path.join(outputRoot, mapIdArg);
const tileSize = 512;
const maxZoom = 4;
const metadata = await sharp(source).metadata();

if (!metadata.width || !metadata.height) throw new Error('无法读取地图图片尺寸');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (let zoom = 0; zoom <= maxZoom; zoom += 1) {
  const scale = 2 ** (zoom - maxZoom);
  const width = Math.max(1, Math.round(metadata.width * scale));
  const height = Math.max(1, Math.round(metadata.height * scale));
  const zoomDirectory = path.join(outputDirectory, String(zoom));
  await mkdir(zoomDirectory, { recursive: true });

  const level = await sharp(source)
    .resize(width, height, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 84, alphaQuality: 90, effort: 5 })
    .toBuffer();

  for (let y = 0; y < Math.ceil(height / tileSize); y += 1) {
    const rowDirectory = path.join(zoomDirectory, String(y));
    await mkdir(rowDirectory, { recursive: true });
    for (let x = 0; x < Math.ceil(width / tileSize); x += 1) {
      const left = x * tileSize;
      const top = y * tileSize;
      const extractWidth = Math.min(tileSize, width - left);
      const extractHeight = Math.min(tileSize, height - top);
      await sharp(level)
        .extract({ left, top, width: extractWidth, height: extractHeight })
        .extend({
          right: tileSize - extractWidth,
          bottom: tileSize - extractHeight,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 84, alphaQuality: 90, effort: 5 })
        .toFile(path.join(rowDirectory, `${x}.webp`));
    }
  }
}

await writeFile(
  path.join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(
    {
      width: metadata.width,
      height: metadata.height,
      tileSize,
      minZoom: 0,
      maxZoom,
      format: 'webp',
    },
    null,
    2
  )}\n`
);
console.log(`已生成 ${mapIdArg} 地图瓦片：${outputDirectory}`);
