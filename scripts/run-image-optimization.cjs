/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// The top-level directory containing your images
const imagesBaseDir = path.join(process.cwd(), 'public', 'images');
// Supported image extensions
const supportedExtensions = ['.png', '.jpg', 'jpeg'];

/**
 * Recursively finds all files with supported extensions in a directory.
 * @param {string} dir The directory to search in.
 * @returns {Promise<string[]>} A promise that resolves to an array of full file paths.
 */
async function findImageFiles(dir) {
  let filesList = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // Recurse into subdirectories and concatenate results
        filesList = filesList.concat(await findImageFiles(fullPath));
      } else if (supportedExtensions.includes(path.extname(item.name).toLowerCase())) {
        filesList.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Could not read directory: ${dir}`, err);
  }
  return filesList;
}

/**
 * Converts a single image to WebP and AVIF formats.
 * @param {string} filePath The full path to the image file.
 * @returns {Promise<void[]>} A promise that resolves when both conversions are settled.
 */
function convertImage(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);

  // Define conversion tasks for this image
  const conversions = [
    sharp(filePath)
      .webp({ quality: 80 })
      .toFile(path.join(dirName, `${baseName}.webp`)),
    sharp(filePath)
      .avif({ quality: 70, effort: 4 }) // 'effort' can be tuned (0-9), lower is faster
      .toFile(path.join(dirName, `${baseName}.avif`)),
  ];

  // Return a promise that settles when both conversions for this image are done
  return Promise.allSettled(conversions);
}

// --- Main Execution ---
(async () => {
  console.log('Starting parallel image conversion...');
  const startTime = Date.now();

  // 1. Find all image files recursively
  const allImages = await findImageFiles(imagesBaseDir);
  if (allImages.length === 0) {
    console.log('No images found to convert.');
    return;
  }
  console.log(`Found ${allImages.length} images to process.`);

  // 2. Create an array of conversion promises for all images
  const conversionTasks = allImages.map(convertImage);

  // 3. Execute all conversion tasks in parallel
  const results = await Promise.all(conversionTasks);

  const endTime = Date.now();
  console.log(`\nImage conversion finished in ${(endTime - startTime) / 1000} seconds.`);

  // 4. (Optional) Log results for failures
  let failedCount = 0;
  results.flat().forEach((result, index) => {
    if (result.status === 'rejected') {
      failedCount++;
      // The original file path can be inferred from the index
      const imageIndex = Math.floor(index / 2);
      const format = index % 2 === 0 ? 'WebP' : 'AVIF';
      console.error(
        `Failed to convert ${allImages[imageIndex]} to ${format}:`,
        result.reason.message
      );
    }
  });

  if (failedCount > 0) {
    console.log(`\n${failedCount} conversion(s) failed. See logs above.`);
  } else {
    console.log('All images converted successfully!');
  }
})();
