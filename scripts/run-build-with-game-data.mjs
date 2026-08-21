import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { createJiti } from 'jiti';

const { loadEnvConfig } = nextEnv;
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const serverOnlyStub = fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.join(projectRoot, 'src'),
    'server-only': serverOnlyStub,
  },
});

loadEnvConfig(projectRoot);

const {
  addFinalEpochMeasurement,
  createDisabledBuildGameDataPrepass,
  createEnabledBuildGameDataPrepass,
} = jiti('../src/lib/gameData/buildGameDataPrepass.ts');
const { runBuildAttemptCoordinator } = jiti('../src/lib/gameData/buildAttemptCoordinator.ts');
const { removeBuildGameDataArtifactFile, writeBuildGameDataArtifactFile } = jiti(
  '../src/lib/gameData/buildArtifactFile.ts'
);
const { queryCharacterContributorSource } = jiti(
  '../src/lib/gameData/characterContributorSourceQuery.ts'
);
const { queryApprovedPublicActionSource } = jiti('../src/lib/gameData/publicActionQueries.ts');
const { readApprovedReplayEpoch } = jiti('../src/lib/gameData/approvedReplayEpoch.ts');
const { querySyncedHistorySource } = jiti('../src/lib/gameData/syncedHistorySourceQuery.ts');
const { fetchWithRetry } = jiti('../src/lib/supabase/fetch-retry.ts');

const outputScript = process.argv[2];
if (!['build:output', 'build:output:debug', 'build:output:skip-images'].includes(outputScript)) {
  throw new Error('usage: run-build-with-game-data.mjs <internal-output-script>');
}

const deploymentIdentity = process.env.DEPLOY_BUILD_ID?.trim() || randomUUID();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const deliberatelyDisabled =
  process.env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || (!supabaseUrl && !publishableKey);

if (!deliberatelyDisabled && (!supabaseUrl || !publishableKey)) {
  throw new Error('Supabase build acquisition requires both URL and publishable key');
}

// This acquisition client is deliberately constructed here from only the public
// configuration. It never consults or selects an admin/secret client.
const acquisitionClient = deliberatelyDisabled
  ? undefined
  : createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchWithRetry },
    });

function artifactPathForAttempt(attempt) {
  return path.join(
    projectRoot,
    '.tmp',
    'build-game-data',
    `${deploymentIdentity}-${attempt}-${randomUUID()}.json`
  );
}

async function removeGeneratedOutput() {
  await rm(path.join(projectRoot, '.next'), { recursive: true, force: true });
  const publicDirectory = path.join(projectRoot, 'public');
  let entries = [];
  try {
    entries = await readdir(publicDirectory);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((name) =>
        /^(sw(?:\.js(?:\.map)?)?|swe-worker-.*|workbox-.*|fallback-.*|version\.json)$/.test(name)
      )
      .map((name) => rm(path.join(publicDirectory, name), { force: true }))
  );
}

async function runNpmScript(script, artifactPath) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('npm_execpath_unavailable');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', script], {
      cwd: projectRoot,
      env: {
        ...process.env,
        DEPLOY_BUILD_ID: deploymentIdentity,
        GAME_DATA_BUILD_ARTIFACT_PATH: artifactPath,
      },
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`build_output_failed:${code ?? signal ?? 'unknown'}`));
    });
  });
}

await runBuildAttemptCoordinator({
  maxAttempts: 3,
  async prepareAttempt(attempt) {
    const artifactPath = artifactPathForAttempt(attempt);
    const result = deliberatelyDisabled
      ? createDisabledBuildGameDataPrepass(attempt, deploymentIdentity)
      : await createEnabledBuildGameDataPrepass(attempt, deploymentIdentity, {
          queryContributors: () => queryCharacterContributorSource(acquisitionClient),
          querySyncedHistory: () => querySyncedHistorySource(acquisitionClient),
          readReplayEpoch: () => readApprovedReplayEpoch(acquisitionClient),
          queryApprovedActions: () => queryApprovedPublicActionSource(acquisitionClient),
        });
    await writeBuildGameDataArtifactFile(artifactPath, result.artifact);
    return { artifactPath, replayEpoch: result.replayEpoch, summary: result.summary };
  },
  runOutputPipeline: (_attempt, artifactPath) => runNpmScript(outputScript, artifactPath),
  async readFinalEpoch() {
    if (!acquisitionClient) throw new Error('unexpected_disabled_epoch_read');
    const startedAt = performance.now();
    const epoch = await readApprovedReplayEpoch(acquisitionClient);
    return { epoch, durationMs: performance.now() - startedAt };
  },
  addFinalEpochMeasurement,
  async cleanFailedAttempt(artifactPath) {
    await removeGeneratedOutput();
    if (artifactPath) await removeBuildGameDataArtifactFile(artifactPath);
  },
  removeAcceptedArtifact: removeBuildGameDataArtifactFile,
  emitSummary(summary) {
    console.log(JSON.stringify(summary));
  },
});
