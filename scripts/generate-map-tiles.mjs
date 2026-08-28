import { access, mkdir, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const force = args.includes('--force');
const concurrencyArg = args.find((arg) => arg.startsWith('--concurrency='));
const requestedConcurrency = concurrencyArg?.slice('--concurrency='.length);
const parsedConcurrency = requestedConcurrency ? Number.parseInt(requestedConcurrency, 10) : null;
if (
  requestedConcurrency !== undefined &&
  (!Number.isInteger(parsedConcurrency) || parsedConcurrency < 1)
) {
  console.error('--concurrency 必须是大于或等于 1 的整数');
  process.exit(1);
}
const positionalArgs = args.filter((arg) => arg !== '--force' && !arg.startsWith('--concurrency='));
const [sourceArg, mapIdArg, outputArg] = positionalArgs;

if (!sourceArg || !mapIdArg) {
  console.error(
    '用法: npm run generate:map-tiles -- <源图片> <地图标识> [输出目录，默认 public/images/map-tiles] [--force] [--concurrency=并行数]'
  );
  process.exit(1);
}

const source = path.resolve(sourceArg);
const outputRoot = path.resolve(outputArg ?? 'public/images/map-tiles');
const outputDirectory = path.join(outputRoot, mapIdArg);
const tileSize = 512;
const maxZoom = 4;
const webpMaxDimension = 16383;
const formats = ['webp', 'avif'];
const rowConcurrency = parsedConcurrency ?? Math.min(2, availableParallelism());
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
  format === 'avif'
    ? image.avif({ quality: 52, effort: 5 })
    : image.webp({ quality: 84, alphaQuality: 90, effort: 5 });

const runWithConcurrency = async (items, concurrency, worker) => {
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await worker(item);
      }
    })
  );
};

const createProgressReporter = (zoom, total) => {
  let completed = 0;
  let lastRenderedAt = 0;
  let lastLoggedPercent = -10;

  const render = (forceRender = false) => {
    const now = Date.now();
    const percent = Math.floor((completed / total) * 100);
    if (!forceRender && now - lastRenderedAt < 100) return;

    const message = `${mapIdArg} zoom ${zoom}: ${completed}/${total} (${percent}%)，并行数 ${rowConcurrency}`;
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${message}\x1b[K`);
    } else if (forceRender || percent >= lastLoggedPercent + 10) {
      console.log(message);
      lastLoggedPercent = percent;
    }
    lastRenderedAt = now;
  };

  return {
    start: () => render(true),
    increment: () => {
      completed += 1;
      render();
    },
    finish: () => {
      render(true);
      if (process.stdout.isTTY) process.stdout.write('\n');
    },
  };
};

for (let zoom = 0; zoom <= maxZoom; zoom += 1) {
  const scale = 2 ** (zoom - maxZoom);
  const width = Math.max(1, Math.round(metadata.width * scale));
  const height = Math.max(1, Math.round(metadata.height * scale));
  const zoomDirectory = path.join(outputDirectory, String(zoom));
  await mkdir(zoomDirectory, { recursive: true });

  const pendingRows = [];

  for (let y = 0; y < Math.ceil(height / tileSize); y += 1) {
    const rowDirectory = path.join(zoomDirectory, String(y));
    await mkdir(rowDirectory, { recursive: true });
    const top = y * tileSize;
    const extractHeight = Math.min(tileSize, height - top);
    const tiles = [];
    for (let x = 0; x < Math.ceil(width / tileSize); x += 1) {
      const left = x * tileSize;
      const extractWidth = Math.min(tileSize, width - left);
      const pendingFormats = [];
      for (const format of formats) {
        const outputPath = path.join(rowDirectory, `${x}.${format}`);
        if (force || !(await fileExists(outputPath))) pendingFormats.push(format);
      }
      if (pendingFormats.length > 0) {
        tiles.push({
          left,
          extractWidth,
          pendingFormats,
          rowDirectory,
          x,
        });
      }
    }
    if (tiles.length > 0) pendingRows.push({ top, extractHeight, tiles });
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

  if (pendingRows.length === 0 && pendingPreviewFormats.length === 0) continue;

  const pendingResourceCount =
    pendingRows.reduce(
      (rowCount, row) =>
        rowCount + row.tiles.reduce((tileCount, tile) => tileCount + tile.pendingFormats.length, 0),
      0
    ) + pendingPreviewFormats.length;
  const progress = createProgressReporter(zoom, pendingResourceCount);

  let level = source;
  if (width !== metadata.width || height !== metadata.height) {
    const resizedLevel = sharp(source).resize(width, height, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    });
    level =
      width <= webpMaxDimension && height <= webpMaxDimension
        ? await resizedLevel.webp({ quality: 84, alphaQuality: 90, effort: 5 }).toBuffer()
        : await resizedLevel.png().toBuffer();
  }

  progress.start();
  try {
    await runWithConcurrency(pendingRows, rowConcurrency, async (row) => {
      const { data: rowData, info: rowInfo } = await sharp(level)
        .extract({ left: 0, top: row.top, width, height: row.extractHeight })
        .raw()
        .toBuffer({ resolveWithObject: true });

      for (const tile of row.tiles) {
        const image = sharp(rowData, { raw: rowInfo })
          .extract({
            left: tile.left,
            top: 0,
            width: tile.extractWidth,
            height: row.extractHeight,
          })
          .extend({
            right: tileSize - tile.extractWidth,
            bottom: tileSize - row.extractHeight,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          });
        await Promise.all(
          tile.pendingFormats.map(async (format) => {
            await encodeImage(image.clone(), format).toFile(
              path.join(tile.rowDirectory, `${tile.x}.${format}`)
            );
            generatedTileCount += 1;
            progress.increment();
          })
        );
      }
    });

    await Promise.all(
      pendingPreviewFormats.map(async (format) => {
        await encodeImage(sharp(level), format).toFile(
          path.join(outputDirectory, `preview.${format}`)
        );
        generatedPreviewCount += 1;
        progress.increment();
      })
    );
  } finally {
    progress.finish();
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
