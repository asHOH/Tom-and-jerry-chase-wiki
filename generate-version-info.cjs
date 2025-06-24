#!/usr/bin/env node

/**
 * Generate version info file for Vercel deployment
 * Creates a JSON file that VersionChecker can poll for updates
 */

/* eslint-disable */
// This file is a Node.js utility script, not part of the Next.js app

const fs = require('fs');
const path = require('path');

console.log('🔄 Generating version info...');

// Get environment info
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const isVercel = process.env.VERCEL === '1';

// Generate version info
const now = new Date();
const shanghaiOffset = 8; // UTC+8
const utc = now.getTime() + now.getTimezoneOffset() * 60000;
const shanghaiTime = new Date(utc + shanghaiOffset * 3600000);

const timestamp = shanghaiTime.toISOString().replace(/[-:T]/g, '').slice(0, 14);

let version, commitSha, buildTime;

if (isVercel) {
  // Use Vercel environment variables
  commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown';
  const commitRef = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || 'main';
  version = `v${timestamp.slice(0, 8)}-${commitSha.slice(0, 8)}`;
  buildTime = shanghaiTime.toISOString();

  console.log(`🌐 Vercel deployment detected`);
  console.log(`📝 Commit: ${commitSha.slice(0, 8)} (${commitRef})`);
} else if (isCI) {
  // GitHub Actions
  commitSha = process.env.GITHUB_SHA || 'unknown';
  version = `v${timestamp.slice(0, 8)}-${commitSha.slice(0, 8)}`;
  buildTime = shanghaiTime.toISOString();

  console.log(`🤖 CI environment detected`);
} else {
  // Local development
  commitSha = 'dev-local';
  version = `dev-${timestamp}`;
  buildTime = shanghaiTime.toISOString();

  console.log(`💻 Local development`);
}

const versionInfo = {
  version,
  commitSha,
  buildTime,
  timestamp: timestamp,
  environment: isVercel ? 'vercel' : isCI ? 'ci' : 'development',
  generatedAt: new Date().toISOString(),
};

console.log(`📝 Generated version: ${version}`);

// Write to public directory
const outputPath = path.join(process.cwd(), 'public', 'version.json');
const outputDir = path.dirname(outputPath);

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2), 'utf8');
  console.log(`✅ Version info written to: ${outputPath}`);
  console.log(`🎉 Done!`);
} catch (error) {
  console.error('❌ Error writing version info:', error.message);
  process.exit(1);
}
