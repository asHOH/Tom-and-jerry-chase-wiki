import { spawn } from 'node:child_process';
import { constants } from 'node:os';

export class BuildOutputError extends Error {
  constructor(code, signal) {
    super(`build_output_failed:${code ?? signal ?? 'unknown'}`);
    this.exitCode = code ?? (constants.signals[signal] ? 128 + constants.signals[signal] : 1);
  }
}

export function runBuildOutput(script, { cwd, env }) {
  const npmCli = env.npm_execpath;
  if (!npmCli) throw new Error('npm_execpath_unavailable');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', script], {
      cwd,
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new BuildOutputError(code, signal));
    });
  });
}
