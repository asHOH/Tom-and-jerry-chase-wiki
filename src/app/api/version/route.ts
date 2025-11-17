import { NextResponse } from 'next/server';
import packageJson from '@/../package.json';

// Server start time for development (when this module loads)
const SERVER_START_TIME = new Date().toISOString();

const sanitize = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined') {
    return undefined;
  }
  return trimmed;
};

const resolveCommitSha = () => {
  const candidates = [
    process.env.COMMIT_SHA,
    process.env.DEPLOY_COMMIT_SHA,
    process.env.NETLIFY_COMMIT_SHA,
    process.env.CF_PAGES_COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.COMMIT_REF,
  ];

  for (const candidate of candidates) {
    const value = sanitize(candidate);
    if (value) {
      return value;
    }
  }

  return 'unknown';
};

const COMMIT_SHA = resolveCommitSha();

if (COMMIT_SHA === 'unknown' && process.env.NODE_ENV === 'production') {
  console.warn(
    '[version-route] COMMIT_SHA is missing. Set COMMIT_SHA (or DEPLOY_COMMIT_SHA) to expose accurate build metadata.'
  );
}

// Generate a static version that only changes with deployments
const VERSION =
  COMMIT_SHA !== 'unknown'
    ? `${packageJson.version}-${COMMIT_SHA.slice(0, 8)}`
    : `${packageJson.version}-dev`;

const normalizeDeploymentLabel = (value: string) => {
  const normalized = value.toLowerCase();
  if (['production', 'prod', 'release'].includes(normalized)) {
    return 'production';
  }
  if (['preview', 'staging', 'deploy-preview', 'pr', 'branch'].includes(normalized)) {
    return 'preview';
  }
  if (['development', 'dev', 'local'].includes(normalized)) {
    return 'development';
  }
  return value;
};

// Detect deployment environment
const getDeploymentEnvironment = () => {
  const manualEnv = sanitize(
    process.env.DEPLOYMENT_ENVIRONMENT || process.env.DEPLOY_ENV || process.env.RUNTIME_ENVIRONMENT
  );
  if (manualEnv) {
    return normalizeDeploymentLabel(manualEnv);
  }

  const vercelEnv = sanitize(process.env.VERCEL_ENV);
  if (vercelEnv) {
    return normalizeDeploymentLabel(vercelEnv);
  }

  const netlifyContext = sanitize(process.env.CONTEXT || process.env.NETLIFY_CONTEXT);
  if (netlifyContext) {
    return normalizeDeploymentLabel(netlifyContext);
  }

  if (sanitize(process.env.CF_PAGES)) {
    const branch = sanitize(process.env.CF_PAGES_BRANCH);
    const productionBranch = sanitize(process.env.CF_PAGES_BASE_BRANCH);
    if (branch && productionBranch) {
      return branch === productionBranch ? 'production' : 'preview';
    }
    return 'preview';
  }

  const nodeEnv = sanitize(process.env.NODE_ENV) || 'development';
  return nodeEnv === 'production' ? 'production' : 'development';
};

// Get appropriate timestamp based on environment
const getVersionTimestamp = (environment: string) => {
  if (environment === 'development') {
    // For local development: show server start time
    return SERVER_START_TIME;
  }

  // For preview/production: use build-time environment variable
  return process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || SERVER_START_TIME;
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
