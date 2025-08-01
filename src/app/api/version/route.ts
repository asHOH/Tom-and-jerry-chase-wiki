import { NextResponse } from 'next/server';
import packageJson from '@/../package.json';

// Server start time for development (when this module loads)
const SERVER_START_TIME = new Date().toISOString();

// Git commit info - static at build time
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

// Get appropriate timestamp based on environment
const getVersionTimestamp = (environment: string) => {
  if (environment === 'development') {
    // For local development: show server start time
    return SERVER_START_TIME;
  } else {
    // For preview/production: try to get actual build/deployment time
    const buildTimestamp =
      process.env.VERCEL_BUILD_TIMESTAMP || // Unix timestamp when build started
      process.env.BUILD_TIME || // Custom build time if set
      SERVER_START_TIME; // Fallback to server start

    // Convert Unix timestamp to ISO string if needed
    if (buildTimestamp && /^\d+$/.test(buildTimestamp)) {
      return new Date(parseInt(buildTimestamp) * 1000).toISOString();
    }

    return buildTimestamp;
  }
};

// Generate version info without shell commands
export async function GET() {
  const environment = getDeploymentEnvironment();
  const versionInfo = {
    version: VERSION,
    commitSha: COMMIT_SHA.slice(0, 8),
    buildTime: getVersionTimestamp(environment), // Smart timestamp based on environment
    environment,
    packageVersion: packageJson.version,
  };

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
