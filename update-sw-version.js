#!/usr/bin/env node

/**
 * Cross-platform script to update service worker cache version
 * Works on Windows, macOS, and Linux
 */

/* eslint-disable */
// This file is a Node.js utility script, not part of the Next.js app

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating service worker cache version...');

// Generate cache version based on environment
// Use Asia/Shanghai timezone consistently (same as deploy workflow)
const now = new Date();

// Get Shanghai time using proper timezone offset
const shanghaiOffset = 8; // UTC+8
const utc = now.getTime() + now.getTimezoneOffset() * 60000;
const shanghaiTime = new Date(utc + shanghaiOffset * 3600000);

// Format as YYYYMMDDHHMMSS
const year = shanghaiTime.getFullYear();
const month = String(shanghaiTime.getMonth() + 1).padStart(2, '0');
const day = String(shanghaiTime.getDate()).padStart(2, '0');
const hour = String(shanghaiTime.getHours()).padStart(2, '0');
const minute = String(shanghaiTime.getMinutes()).padStart(2, '0');
const second = String(shanghaiTime.getSeconds()).padStart(2, '0');
const timestamp = `${year}${month}${day}${hour}${minute}${second}`;

// Log timezone info for debugging
console.log(
  `🕐 Using Shanghai time: ${shanghaiTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
);

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

let CACHE_VERSION;
if (isCI && process.env.GITHUB_SHA) {
  // In CI: use date + commit hash
  const date = timestamp.slice(0, 8); // YYYYMMDD
  const commitHash = process.env.GITHUB_SHA.slice(0, 8);
  CACHE_VERSION = `v${date}-${commitHash}`;
} else if (isDev) {
  // In development: use dev prefix
  CACHE_VERSION = `dev-${timestamp.slice(0, 8)}-${timestamp.slice(8, 14)}`;
} else {
  // Default: use timestamp
  CACHE_VERSION = `v${timestamp.slice(0, 8)}-${timestamp.slice(8, 14)}`;
}

console.log(`📝 Generated cache version: ${CACHE_VERSION}`);

// Path to service worker file
const swPath = path.join(__dirname, 'public', 'sw.js');

// Check if service worker file exists
if (!fs.existsSync(swPath)) {
  console.error('❌ Error: public/sw.js not found!');
  process.exit(1);
}

try {
  // Read service worker file with UTF-8 encoding
  let content = fs.readFileSync(swPath, 'utf8');

  // Check if placeholder exists
  if (!content.includes('__CACHE_VERSION__')) {
    console.warn('⚠️  Warning: __CACHE_VERSION__ placeholder not found in public/sw.js');
    console.warn('   The service worker might already have a version set.');

    // Try to find and replace existing version pattern
    const versionRegex = /const CACHE_VERSION = ['"`]([^'"`]+)['"`];/;
    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, `const CACHE_VERSION = '${CACHE_VERSION}';`);
      console.log('📝 Updated existing cache version pattern');
    } else {
      console.error('❌ Could not find cache version pattern to update');
      process.exit(1);
    }
  } else {
    // Replace placeholder with actual version
    content = content.replace(/__CACHE_VERSION__/g, CACHE_VERSION);
  }

  // Write back with UTF-8 encoding
  fs.writeFileSync(swPath, content, 'utf8');

  console.log(`✅ Service worker updated with cache version: ${CACHE_VERSION}`);
  console.log('🎉 Done! You can now run your build or dev server');
} catch (error) {
  console.error('❌ Error updating service worker:', error.message);
  process.exit(1);
}
