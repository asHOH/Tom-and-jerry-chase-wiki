/* oxlint-disable typescript/no-require-imports */
const crypto = require('node:crypto');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// The top-level directory containing your images
const imagesBaseDir = path.join(process.cwd(), 'public', 'images');
const cacheBaseDir = path.join(process.cwd(), '.next', 'cache', 'tjwiki-images');
const legacyMigrationMarker = path.join(cacheBaseDir, '.legacy-migration-complete');
// Supported image extensions
const supportedExtensions = ['.png', '.jpg', '.jpeg'];
const outputDefinitions = [
  {
    format: 'WebP',
    extension: '.webp',
    options: { quality: 80 },
    convert: (input, outputPath) => sharp(input).webp({ quality: 80 }).toFile(outputPath),
  },
  {
    format: 'AVIF',
    extension: '.avif',
    options: { quality: 70, effort: 4 },
    convert: (input, outputPath) =>
      sharp(input).avif({ quality: 70, effort: 4 }).toFile(outputPath),
  },
];
const encoderSignature = crypto
  .createHash('sha256')
  .update(
    JSON.stringify({
      schemaVersion: 1,
      sharpVersions: sharp.versions,
      outputs: outputDefinitions.map(({ format, extension, options }) => ({
        format,
        extension,
        options,
      })),
    })
  )
  .digest('hex')
  .slice(0, 24);
const cacheDir = path.join(cacheBaseDir, encoderSignature);
const cacheWrites = new Map();

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
 * @param {boolean} allowLegacyMigration Whether current sibling outputs may seed the persistent cache.
 * @returns {Promise<Array<{filePath: string, format: string, status: 'converted' | 'restored' | 'migrated' | 'failed', error?: unknown}>>}
 */
async function convertImage(filePath, allowLegacyMigration) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);
  let input;
  let sourceHash;
  let sourceStats;
  try {
    [input, sourceStats] = await Promise.all([fs.readFile(filePath), fs.stat(filePath)]);
    sourceHash = crypto.createHash('sha256').update(input).digest('hex');
  } catch (error) {
    return outputDefinitions.map(({ format }) => ({
      filePath,
      format,
      status: 'failed',
      error,
    }));
  }

  return Promise.all(
    outputDefinitions.map(async ({ format, extension, convert }) => {
      const outputPath = path.join(dirName, `${baseName}${extension}`);
      const cachePath = path.join(cacheDir, `${sourceHash}${extension}`);

      try {
        let cacheWrite = cacheWrites.get(cachePath);
        if (!cacheWrite) {
          cacheWrite = (async () => {
            try {
              const cacheStats = await fs.stat(cachePath);
              if (cacheStats.size > 0) {
                return 'restored';
              }
            } catch (error) {
              if (error?.code !== 'ENOENT') {
                throw error;
              }
            }

            if (allowLegacyMigration) {
              try {
                const outputStats = await fs.stat(outputPath);
                if (outputStats.size > 0 && outputStats.mtime > sourceStats.mtime) {
                  await fs.copyFile(outputPath, cachePath);
                  return 'migrated';
                }
              } catch (error) {
                if (error?.code !== 'ENOENT') {
                  throw error;
                }
              }
            }

            const temporaryCachePath = `${cachePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
            try {
              await convert(input, temporaryCachePath);
              await fs.rename(temporaryCachePath, cachePath);
            } catch (error) {
              await fs.rm(temporaryCachePath, { force: true });
              throw error;
            }
            return 'converted';
          })();
          cacheWrites.set(cachePath, cacheWrite);
        }

        const status = await cacheWrite;
        await fs.copyFile(cachePath, outputPath);
        return { filePath, format, status };
      } catch (error) {
        return { filePath, format, status: 'failed', error };
      }
    })
  );
}

async function main() {
  const startTime = Date.now();
  const allowLegacyMigration = await fs
    .access(legacyMigrationMarker)
    .then(() => false)
    .catch((error) => {
      if (error?.code === 'ENOENT') {
        return true;
      }
      throw error;
    });
  await fs.mkdir(cacheDir, { recursive: true });

  const allImages = await findImageFiles(imagesBaseDir);
  if (allImages.length === 0) {
    console.log(
      'Image optimization summary: images=0 outputs=0 converted=0 restored=0 migrated=0 failed=0'
    );
    return;
  }
  console.log(`Optimizing ${allImages.length} source images...`);

  const progressLogDelayMs = 3000;
  const milestonePercents = [0.2, 0.4, 0.6, 0.8, 1];
  let inspectedCount = 0;
  let nextMilestoneIndex = 0;
  let progressLoggingEnabled = false;

  const logProgress = (milestone) => {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `Progress: inspected ${inspectedCount}/${allImages.length} images (${Math.round(
        milestone * 100
      )}%) in ${elapsedSeconds}s`
    );
  };

  const progressTimer = setTimeout(() => {
    progressLoggingEnabled = true;
    const latestReachedMilestone = milestonePercents[nextMilestoneIndex - 1];
    if (latestReachedMilestone !== undefined) {
      logProgress(latestReachedMilestone);
    }
  }, progressLogDelayMs);

  const conversionTasks = allImages.map((imagePath) =>
    convertImage(imagePath, allowLegacyMigration).then((result) => {
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

      if (reachedMilestone !== undefined && progressLoggingEnabled) {
        logProgress(reachedMilestone);
      }

      return result;
    })
  );

  const results = (
    await Promise.all(conversionTasks).finally(() => clearTimeout(progressTimer))
  ).flat();
  const counts = { converted: 0, restored: 0, migrated: 0, failed: 0 };

  for (const result of results) {
    counts[result.status]++;
    if (result.status === 'failed') {
      const message = result.error instanceof Error ? result.error.message : String(result.error);
      console.error(`Failed to optimize ${result.filePath} as ${result.format}: ${message}`);
    }
  }

  if (counts.failed === 0 && allowLegacyMigration) {
    await fs.writeFile(legacyMigrationMarker, `${encoderSignature}\n`, 'utf8');
  }

  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(3);
  console.log(
    `Image optimization summary: images=${allImages.length} outputs=${results.length} converted=${counts.converted} restored=${counts.restored} migrated=${counts.migrated} failed=${counts.failed} duration=${elapsedSeconds}s`
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
