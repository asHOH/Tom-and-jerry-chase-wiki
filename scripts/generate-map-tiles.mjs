import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const force = args.includes('--force');
const positionalArgs = args.filter((arg) => arg !== '--force');
const [sourceArg, mapIdArg, outputArg] = positionalArgs;

if (!sourceArg || !mapIdArg) {
  console.error(
    '用法: npm run generate:map-tiles -- <源图片> <地图标识> [输出目录，默认 public/images/map-tiles] [--force]'
  );
  process.exit(1);
}

const source = path.resolve(sourceArg);
const outputRoot = path.resolve(outputArg ?? 'public/images/map-tiles');
const outputDirectory = path.join(outputRoot, mapIdArg);
const tileSize = 512;
const maxZoom = 4;
const formats = ['webp', 'avif'];
const WEBP_OPTIONS = { quality: 72, alphaQuality: 80, effort: 6 };
const AVIF_OPTIONS = { quality: 45, effort: 7 };
const metadata = await sharp(source).metadata();
let generatedTileCount = 0;
let generatedPreviewCount = 0;

if (!metadata.width || !metadata.height) throw new Error('无法读取地图图片尺寸');

await mkdir(outputDirectory, { recursive: true });

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const encodeImage = (image, format) =>
  format === 'avif' ? image.avif(AVIF_OPTIONS) : image.webp(WEBP_OPTIONS);

for (let zoom = 0; zoom <= maxZoom; zoom += 1) {
  const scale = 2 ** (zoom - maxZoom);
  const width = Math.max(1, Math.round(metadata.width * scale));
  const height = Math.max(1, Math.round(metadata.height * scale));
  const zoomDirectory = path.join(outputDirectory, String(zoom));
  await mkdir(zoomDirectory, { recursive: true });

  const pendingTiles = [];

  for (let y = 0; y < Math.ceil(height / tileSize); y += 1) {
    const rowDirectory = path.join(zoomDirectory, String(y));
    await mkdir(rowDirectory, { recursive: true });
    for (let x = 0; x < Math.ceil(width / tileSize); x += 1) {
      const left = x * tileSize;
      const top = y * tileSize;
      const extractWidth = Math.min(tileSize, width - left);
      const extractHeight = Math.min(tileSize, height - top);
      const pendingFormats = [];
      for (const format of formats) {
        const outputPath = path.join(rowDirectory, `${x}.${format}`);
        if (force || !(await fileExists(outputPath))) pendingFormats.push(format);
      }
      if (pendingFormats.length > 0) {
        pendingTiles.push({
          left,
          top,
          extractWidth,
          extractHeight,
          pendingFormats,
          rowDirectory,
          x,
        });
      }
    }
  }

  const pendingPreviewFormats =
    zoom === 0
      ? await Promise.all(
          formats.map(async (format) => {
            const outputPath = path.join(outputDirectory, `preview.${format}`);
            return force || !(await fileExists(outputPath)) ? format : null;
          })
        ).then((results) => results.filter((format) => format !== null))
      : [];

  if (pendingTiles.length === 0 && pendingPreviewFormats.length === 0) continue;

  const level = await sharp(source)
    .resize(width, height, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .webp(WEBP_OPTIONS)
    .toBuffer();

  for (const tile of pendingTiles) {
    const image = sharp(level)
      .extract({
        left: tile.left,
        top: tile.top,
        width: tile.extractWidth,
        height: tile.extractHeight,
      })
      .extend({
        right: tileSize - tile.extractWidth,
        bottom: tileSize - tile.extractHeight,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    await Promise.all(
      tile.pendingFormats.map((format) =>
        encodeImage(image.clone(), format).toFile(
          path.join(tile.rowDirectory, `${tile.x}.${format}`)
        )
      )
    );
    generatedTileCount += tile.pendingFormats.length;
  }

  await Promise.all(
    pendingPreviewFormats.map((format) =>
      encodeImage(sharp(level), format).toFile(path.join(outputDirectory, `preview.${format}`))
    )
  );
  generatedPreviewCount += pendingPreviewFormats.length;
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
      formats,
    },
    null,
    2
  )}\n`
);
const generatedCount = generatedTileCount + generatedPreviewCount;
console.log(
  generatedCount > 0
    ? `已生成 ${generatedCount} 个 ${mapIdArg} 地图资源：${outputDirectory}`
    : `${mapIdArg} 地图资源已齐全，跳过生成。`
);
