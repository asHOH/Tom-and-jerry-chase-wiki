import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { isDeepStrictEqual, promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class CompactionScriptError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'CompactionScriptError';
    this.code = code;
    this.details = details;
  }
}

function normalizeRelativePath(path) {
  return path.replaceAll('\\', '/');
}

export async function resolveIgnoredTmpPath(projectDir, pathArg, errorPrefix) {
  const path = resolve(projectDir, pathArg);
  const relativePath = relative(projectDir, path);
  if (
    relativePath.startsWith('..') ||
    isAbsolute(relativePath) ||
    !normalizeRelativePath(relativePath).startsWith('.tmp/')
  ) {
    throw new CompactionScriptError(`${errorPrefix}_must_be_under_tmp`);
  }
  try {
    await execFileAsync('git', ['check-ignore', '--quiet', '--', relativePath], {
      cwd: projectDir,
      windowsHide: true,
    });
  } catch {
    throw new CompactionScriptError(`${errorPrefix}_must_be_ignored`);
  }
  return { path, relativePath: normalizeRelativePath(relativePath) };
}

export async function readIgnoredManifest(projectDir, manifestArg) {
  const { path: manifestPath, relativePath: manifestRelativePath } = await resolveIgnoredTmpPath(
    projectDir,
    manifestArg,
    'manifest'
  );

  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (!Array.isArray(manifest?.rows) || typeof manifest?.repository?.head !== 'string') {
      throw new CompactionScriptError('invalid_manifest');
    }
    return {
      manifest,
      manifestPath,
      manifestRelativePath,
    };
  } catch {
    throw new CompactionScriptError('invalid_manifest');
  }
}

export function defaultRetainedRowsPath(manifestPath, replayEpoch) {
  const extension = extname(manifestPath);
  const stem = basename(manifestPath, extension);
  return resolve(dirname(manifestPath), `${stem}.retained-rows-${replayEpoch}.json`);
}

export function retainedRowsDigest(serialized) {
  return `v1:${createHash('sha256').update(serialized, 'utf8').digest('hex')}`;
}

export async function writeRetainedRowsEvidence(path, evidence) {
  let existingRaw;
  try {
    existingRaw = await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw new CompactionScriptError('retained_rows_read_failed');
  }

  if (existingRaw !== undefined) {
    let existing;
    try {
      existing = JSON.parse(existingRaw);
    } catch {
      throw new CompactionScriptError('retained_rows_conflict');
    }
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      throw new CompactionScriptError('retained_rows_conflict');
    }
    const { capturedAt: _existingCapturedAt, ...existingStable } = existing;
    const { capturedAt: _nextCapturedAt, ...nextStable } = evidence;
    if (!isDeepStrictEqual(existingStable, nextStable) || typeof existing.capturedAt !== 'string') {
      throw new CompactionScriptError('retained_rows_conflict');
    }
    return { evidence: existing, serialized: existingRaw };
  }

  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  let handle;
  try {
    handle = await open(path, 'wx');
    await handle.writeFile(serialized, 'utf8');
    await handle.sync();
  } catch (error) {
    throw new CompactionScriptError('retained_rows_write_failed', { cause: error?.code });
  } finally {
    await handle?.close();
  }

  const persisted = await readFile(path, 'utf8');
  if (persisted !== serialized)
    throw new CompactionScriptError('retained_rows_write_verification_failed');
  return { evidence, serialized };
}

export function readPreCutoverRetainedRowsBinding(manifest) {
  const binding = manifest?.result?.preCutoverRetainedRows;
  if (binding === undefined) return null;
  if (
    binding?.receiptKind !== 'preCutoverRetainedRows' ||
    typeof binding.path !== 'string' ||
    !/^v1:[a-f0-9]{64}$/u.test(binding.fileDigest ?? '') ||
    typeof binding.capturedAt !== 'string' ||
    !Number.isSafeInteger(binding.replayEpoch) ||
    typeof binding.actionRevision !== 'string' ||
    !Number.isSafeInteger(binding.snapshotRowCount) ||
    !Number.isSafeInteger(binding.rowCount) ||
    typeof binding.target?.host !== 'string' ||
    typeof binding.target?.projectRef !== 'string'
  ) {
    throw new CompactionScriptError('invalid_pre_cutover_retained_rows_binding');
  }
  return binding;
}

export async function readIgnoredRetainedRows(projectDir, retainedRowsArg, manifest) {
  const { path: retainedRowsPath, relativePath: retainedRowsRelativePath } =
    await resolveIgnoredTmpPath(projectDir, retainedRowsArg, 'retained_rows');
  let retained;
  let serialized;
  try {
    serialized = await readFile(retainedRowsPath, 'utf8');
    retained = JSON.parse(serialized);
  } catch {
    throw new CompactionScriptError('invalid_retained_rows');
  }
  if (!Array.isArray(retained?.rows)) {
    throw new CompactionScriptError('invalid_retained_rows');
  }
  const binding = readPreCutoverRetainedRowsBinding(manifest);
  if (binding) {
    const digest = retainedRowsDigest(serialized);
    const metadataMatches =
      retained.schemaVersion === 1 &&
      retained.receiptKind === binding.receiptKind &&
      retained.capturedAt === binding.capturedAt &&
      retained.replayEpoch === binding.replayEpoch &&
      retained.actionRevision === binding.actionRevision &&
      retained.snapshotRowCount === binding.snapshotRowCount &&
      retained.rowCount === binding.rowCount &&
      retained.rows.length === binding.rowCount &&
      retained.target?.host === binding.target.host &&
      retained.target?.projectRef === binding.target.projectRef;
    if (retainedRowsRelativePath !== binding.path) {
      throw new CompactionScriptError('retained_rows_path_mismatch');
    }
    if (digest !== binding.fileDigest) {
      throw new CompactionScriptError('retained_rows_digest_mismatch');
    }
    if (!metadataMatches) {
      throw new CompactionScriptError('retained_rows_binding_mismatch');
    }
  }
  return {
    retained,
    binding,
    retainedRowsRelativePath,
  };
}
