import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import packageJson from '@/../package.json';

// Dynamically generate version info
export async function GET() {
  try {
    // Get the latest git commit SHA
    const commitSha = execSync('git rev-parse HEAD').toString().trim();

    const versionInfo = {
      version: packageJson.version,
      commitSha,
      buildTime: new Date().toISOString(), // This is now request time
    };

    return NextResponse.json(versionInfo, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate version info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return a fallback response if git command fails
    const fallbackInfo = {
      version: packageJson.version,
      commitSha: 'unknown',
      buildTime: new Date().toISOString(),
      error: 'Failed to retrieve git commit SHA',
      details: errorMessage,
    };

    return NextResponse.json(fallbackInfo, { status: 500 });
  }
}
