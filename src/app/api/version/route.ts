import { NextResponse } from 'next/server';
import packageJson from '@/../package.json';

// Generate version info without shell commands
export async function GET() {
  // Use environment variables that are available at build time
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA ||
    'unknown';

  // Generate a build-time based version for update detection
  const buildId = process.env.BUILD_ID || 'dev';
  const timestamp = process.env.BUILD_TIMESTAMP || Date.now().toString();

  // Create a version that changes with each deployment
  const version =
    commitSha !== 'unknown'
      ? `v${timestamp.slice(-8)}-${commitSha.slice(0, 8)}`
      : `${packageJson.version}-${buildId}`;

  const versionInfo = {
    version,
    commitSha: commitSha.slice(0, 8), // Use short SHA
    buildTime: new Date().toISOString(), // request time
    environment: process.env.NODE_ENV || 'development',
    packageVersion: packageJson.version,
  };

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
