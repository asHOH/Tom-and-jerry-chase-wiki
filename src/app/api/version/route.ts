import { NextResponse } from 'next/server';
import packageJson from '@/../package.json';

// Static build info - generated once at build time
const BUILD_TIME = new Date().toISOString();
const COMMIT_SHA =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  'unknown';

// Generate a static version that only changes with deployments
const VERSION =
  COMMIT_SHA !== 'unknown'
    ? `${packageJson.version}-${COMMIT_SHA.slice(0, 8)}`
    : `${packageJson.version}-dev`;

// Detect deployment environment
const getDeploymentEnvironment = () => {
  // Vercel-specific environment detection
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) {
    return vercelEnv; // 'development', 'preview', or 'production'
  }

  // Fallback to NODE_ENV for non-Vercel deployments
  const nodeEnv = process.env.NODE_ENV || 'development';
  return nodeEnv === 'production' ? 'production' : 'development';
};

// Generate version info without shell commands
export async function GET() {
  const versionInfo = {
    version: VERSION,
    commitSha: COMMIT_SHA.slice(0, 8),
    buildTime: BUILD_TIME, // Static build time, not request time
    environment: getDeploymentEnvironment(), // Use the smarter environment detection
    packageVersion: packageJson.version,
  };

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
