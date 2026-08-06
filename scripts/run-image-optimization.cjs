/* oxlint-disable typescript/no-require-imports */
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// The top-level directory containing your images
const imagesBaseDir = path.join(process.cwd(), 'public', 'images');
// Supported image extensions
const supportedExtensions = ['.png', '.jpg', '.jpeg'];

/**
 * Recursively finds all files with supported extensions in a directory.
 * @param {string} dir The directory to search in.
 * @returns {Promise<string[]>} A promise that resolves to an array of full file paths.
 */
async function findImageFiles(dir) {
  let filesList = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      filesList = filesList.concat(await findImageFiles(fullPath));
    } else if (supportedExtensions.includes(path.extname(item.name).toLowerCase())) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

/**
 * Converts a single image to WebP and AVIF formats.
 * @param {string} filePath The full path to the image file.
 * @returns {Promise<Array<{filePath: string, format: string, status: 'converted' | 'skipped' | 'failed', error?: unknown}>>}
 */
async function convertImage(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);
  const webpPath = path.join(dirName, `${baseName}.webp`);
  const avifPath = path.join(dirName, `${baseName}.avif`);
  const outputs = [
    {
      format: 'WebP',
      outputPath: webpPath,
      convert: () => sharp(filePath).webp({ quality: 80 }).toFile(webpPath),
    },
    {
      format: 'AVIF',
      outputPath: avifPath,
      convert: () => sharp(filePath).avif({ quality: 70, effort: 4 }).toFile(avifPath),
    },
  ];

  let sourceStats;
  try {
    sourceStats = await fs.stat(filePath);
  } catch (error) {
    return outputs.map(({ format }) => ({ filePath, format, status: 'failed', error }));
  }

  return Promise.all(
    outputs.map(async ({ format, outputPath, convert }) => {
      try {
        const outputStats = await fs.stat(outputPath);
        if (outputStats.mtime > sourceStats.mtime) {
          return { filePath, format, status: 'skipped' };
        }
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          return { filePath, format, status: 'failed', error };
        }
      }

      try {
        await convert();
        return { filePath, format, status: 'converted' };
      } catch (error) {
        return { filePath, format, status: 'failed', error };
      }
    })
  );
}

async function main() {
  console.log('Starting parallel image conversion...');
  const startTime = Date.now();

  const allImages = await findImageFiles(imagesBaseDir);
  if (allImages.length === 0) {
    console.log('Image optimization summary: images=0 outputs=0 converted=0 skipped=0 failed=0');
    return;
  }
  console.log(
    `Found ${allImages.length} source images (${allImages.length * 2} output candidates).`
  );

  const milestonePercents = [0.2, 0.4, 0.6, 0.8, 1];
  let inspectedCount = 0;
  let nextMilestoneIndex = 0;

  const conversionTasks = allImages.map((imagePath) =>
    convertImage(imagePath).then((result) => {
      inspectedCount++;
      const progress = inspectedCount / allImages.length;
      let reachedMilestone;

      while (
        nextMilestoneIndex < milestonePercents.length &&
        progress >= milestonePercents[nextMilestoneIndex]
      ) {
        reachedMilestone = milestonePercents[nextMilestoneIndex];
        nextMilestoneIndex++;
      }

      if (reachedMilestone !== undefined) {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `Progress: inspected ${inspectedCount}/${allImages.length} images (${Math.round(
            reachedMilestone * 100
          )}%) in ${elapsedSeconds}s`
        );
      }

      return result;
    })
  );

  const results = (await Promise.all(conversionTasks)).flat();
  const counts = { converted: 0, skipped: 0, failed: 0 };

  for (const result of results) {
    counts[result.status]++;
    if (result.status === 'failed') {
      const message = result.error instanceof Error ? result.error.message : String(result.error);
      console.error(`Failed to optimize ${result.filePath} as ${result.format}: ${message}`);
    }
  }

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(3);
  console.log(
    `Image optimization summary: images=${allImages.length} outputs=${results.length} converted=${counts.converted} skipped=${counts.skipped} failed=${counts.failed} duration=${elapsedSeconds}s`
  );

  if (counts.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(`Fatal: image optimization could not complete: ${message}`);
  process.exitCode = 1;
});
