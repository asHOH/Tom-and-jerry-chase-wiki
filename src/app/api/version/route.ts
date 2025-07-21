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

  const versionInfo = {
    version: packageJson.version,
    commitSha: commitSha.slice(0, 8), // Use short SHA
    buildTime: new Date().toISOString(), // request time
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
