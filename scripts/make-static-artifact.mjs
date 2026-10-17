/**
 * make-static-artifact.mjs — 为“无后端静态构建”生成空的游戏数据 artifact。
 * 等价于 run-build-with-game-data.mjs 在 NEXT_PUBLIC_DISABLE_ARTICLES=1 时的
 * createDisabledBuildGameDataPrepass 路径，但不触发其重试/清理协调器。
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { createJiti } from 'jiti';

const { loadEnvConfig } = nextEnv;
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const serverOnlyStub = fileURLToPath(new URL('./lib/server-only-stub.mjs', import.meta.url));

loadEnvConfig(projectRoot);

const deploymentIdentity = process.env.DEPLOY_BUILD_ID?.trim() || randomUUID();
const artifactPath =
  process.env.GAME_DATA_BUILD_ARTIFACT_PATH?.trim() ||
  path.join(projectRoot, '.tmp', 'build-game-data', `${deploymentIdentity}-static.json`);

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': path.join(projectRoot, 'src'),
    'server-only': serverOnlyStub,
  },
});

const { createDisabledBuildGameDataPrepass } = jiti('../src/lib/gameData/buildGameDataPrepass.ts');
const { writeBuildGameDataArtifactFile } = jiti('../src/lib/gameData/buildArtifactFile.ts');

const result = createDisabledBuildGameDataPrepass(1, deploymentIdentity);
await writeBuildGameDataArtifactFile(artifactPath, result.artifact);

console.log(
  JSON.stringify({
    ok: true,
    mode: 'disabled',
    deploymentIdentity,
    artifactPath,
    summary: result.summary,
  })
);
