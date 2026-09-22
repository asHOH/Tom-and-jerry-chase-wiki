import {
  createCanonicalCompactionDigest,
  verifyCompactionArtifactMetadata,
  type CompactionArtifactMetadata,
} from './compactionVerification';

type EvidenceRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
  created_by: string | null;
  status: string;
  is_public: boolean;
  message: string | null;
};

export type PostCutoverManifestSelection = {
  originalManifestRowIds: string[];
  additionalSyncedRowIds: string[];
  actionIds: string[];
  verificationDependencyRowIds: string[];
  targetHost: string;
};

export type PostCutoverManifestSelectionResult =
  { success: true; value: PostCutoverManifestSelection } | { success: false; failures: string[] };

export type PostCutoverRowEvidenceFailure = {
  code:
    | 'invalid_retained_row'
    | 'invalid_remote_row'
    | 'duplicate_retained_row_id'
    | 'duplicate_remote_row_id'
    | 'retained_row_set_mismatch'
    | 'remote_row_set_mismatch'
    | 'retained_row_not_approved_public'
    | 'remote_row_not_synced_private'
    | 'retained_row_content_mismatch'
    | 'verification_dependency_row_set_mismatch'
    | 'verification_dependency_not_approved_public';
  rowId?: string;
};

export type PostCutoverProductionProof = {
  deployedCommit: string;
  gameDataArtifact: CompactionArtifactMetadata;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readUniqueIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return undefined;
  const ids = value as string[];
  return ids.length === new Set(ids).size ? ids : undefined;
}

export function resolvePostCutoverManifestSelection(
  value: unknown
): PostCutoverManifestSelectionResult {
  if (!isRecord(value) || !Array.isArray(value.rows)) {
    return { success: false, failures: ['invalid_manifest'] };
  }

  const originalManifestRowIds = readUniqueIds(
    value.rows.map((row) => (isRecord(row) ? row.id : undefined))
  );
  const observation = isRecord(value.retrospectiveObservation)
    ? value.retrospectiveObservation
    : undefined;
  const verificationDependencyRowIds = readUniqueIds(value.verificationDependencyRowIds ?? []);
  if (!verificationDependencyRowIds || verificationDependencyRowIds.some((id) => !id)) {
    return { success: false, failures: ['invalid_verification_dependency_row_ids'] };
  }
  const cutoverIds = new Set([
    ...(originalManifestRowIds ?? []),
    ...(readUniqueIds(observation?.additionalObservedSyncedRowIds) ?? []),
  ]);
  if (verificationDependencyRowIds.some((id) => cutoverIds.has(id))) {
    return { success: false, failures: ['verification_dependency_overlaps_cutover'] };
  }
  if (!observation) {
    const cutoverRowIds = readUniqueIds(value.cutoverRowIds ?? originalManifestRowIds);
    const result = isRecord(value.result) ? value.result : {};
    const retained = isRecord(result.preCutoverRetainedRows)
      ? result.preCutoverRetainedRows
      : undefined;
    const retainedTarget = isRecord(retained?.target) ? retained.target : {};
    const hasExactCutoverRows =
      originalManifestRowIds !== undefined &&
      cutoverRowIds !== undefined &&
      cutoverRowIds.length === originalManifestRowIds.length &&
      cutoverRowIds.every((rowId, index) => rowId === originalManifestRowIds[index]);
    if (
      retained?.receiptKind === 'preCutoverRetainedRows' &&
      typeof retained.path === 'string' &&
      /^v1:[a-f0-9]{64}$/u.test(String(retained.fileDigest ?? '')) &&
      retained.rowCount === cutoverRowIds?.length &&
      typeof retainedTarget.host === 'string' &&
      hasExactCutoverRows
    ) {
      return {
        success: true,
        value: {
          originalManifestRowIds,
          additionalSyncedRowIds: [],
          actionIds: cutoverRowIds,
          verificationDependencyRowIds,
          targetHost: retainedTarget.host,
        },
      };
    }
    return { success: false, failures: ['invalid_pre_cutover_retained_rows_binding'] };
  }
  const additionalSyncedRowIds = readUniqueIds(observation?.additionalObservedSyncedRowIds);
  const originalPlan = isRecord(observation?.originalPlan) ? observation.originalPlan : {};
  const remoteState = isRecord(observation?.observedRemoteState)
    ? observation.observedRemoteState
    : {};
  const target = isRecord(observation?.target) ? observation.target : {};
  const failures: string[] = [];

  if (!originalManifestRowIds) failures.push('invalid_original_manifest_rows');
  if (!additionalSyncedRowIds) failures.push('invalid_additional_synced_rows');
  if (typeof target.host !== 'string' || target.host.length === 0) {
    failures.push('invalid_retrospective_target');
  }
  if (originalManifestRowIds && additionalSyncedRowIds) {
    const originalIds = new Set(originalManifestRowIds);
    if (additionalSyncedRowIds.some((rowId) => originalIds.has(rowId))) {
      failures.push('retrospective_row_overlap');
    }
    const actionIds = [...originalManifestRowIds, ...additionalSyncedRowIds];
    if (
      originalPlan.plannedCutoverRowCount !== originalManifestRowIds.length ||
      originalPlan.deferredRowCount !== additionalSyncedRowIds.length ||
      remoteState.rowCount !== actionIds.length ||
      remoteState.status !== 'synced' ||
      remoteState.isPublic !== false
    ) {
      failures.push('retrospective_observation_mismatch');
    }
    if (failures.length === 0) {
      return {
        success: true,
        value: {
          originalManifestRowIds,
          additionalSyncedRowIds,
          actionIds,
          verificationDependencyRowIds,
          targetHost: target.host as string,
        },
      };
    }
  }

  return { success: false, failures };
}

function parseEvidenceRow(value: unknown): EvidenceRow | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.entity_type !== 'string' ||
    !Object.hasOwn(value, 'entry') ||
    typeof value.created_at !== 'string' ||
    (value.created_by !== null && typeof value.created_by !== 'string') ||
    typeof value.status !== 'string' ||
    typeof value.is_public !== 'boolean' ||
    (value.message !== null && typeof value.message !== 'string')
  ) {
    return undefined;
  }
  return value as EvidenceRow;
}

function stableRowContent(row: EvidenceRow): unknown {
  return {
    id: row.id,
    entityType: row.entity_type,
    entry: row.entry,
    createdAt: row.created_at,
    createdBy: row.created_by,
    message: row.message,
  };
}

function indexRows(
  values: readonly unknown[],
  kind: 'retained' | 'remote',
  failures: PostCutoverRowEvidenceFailure[]
): Map<string, EvidenceRow> {
  const rows = new Map<string, EvidenceRow>();
  for (const value of values) {
    const row = parseEvidenceRow(value);
    if (!row) {
      failures.push({ code: kind === 'retained' ? 'invalid_retained_row' : 'invalid_remote_row' });
      continue;
    }
    if (rows.has(row.id)) {
      failures.push({
        code: kind === 'retained' ? 'duplicate_retained_row_id' : 'duplicate_remote_row_id',
        rowId: row.id,
      });
    }
    rows.set(row.id, row);
  }
  return rows;
}

/** Dependency replay accepts only approved/public rows; these rows must stay in that state. */
export function verifyCompactionDependencyRows(
  expectedIds: readonly string[],
  rows: readonly unknown[]
): { proven: boolean; verifiedRowIds: string[]; failures: PostCutoverRowEvidenceFailure[] } {
  const failures: PostCutoverRowEvidenceFailure[] = [];
  const ids = rows.map((row) => (isRecord(row) ? row.id : undefined));
  const actualIds = new Set(ids);
  if (
    rows.length !== expectedIds.length ||
    actualIds.size !== rows.length ||
    new Set(expectedIds).size !== expectedIds.length ||
    expectedIds.some((id) => !actualIds.has(id))
  ) {
    failures.push({ code: 'verification_dependency_row_set_mismatch' });
  }
  for (const row of rows) {
    if (!isRecord(row) || row.status !== 'approved' || row.is_public !== true) {
      failures.push({
        code: 'verification_dependency_not_approved_public',
        ...(isRecord(row) && typeof row.id === 'string' ? { rowId: row.id } : {}),
      });
    }
  }
  const proven = failures.length === 0;
  return { proven, verifiedRowIds: proven ? [...expectedIds] : [], failures };
}

export function verifyPostCutoverRowEvidence(
  expectedIds: readonly string[],
  retainedValues: readonly unknown[],
  remoteValues: readonly unknown[],
  dependencyIds: readonly string[] = []
): {
  proven: boolean;
  verifiedDependencyRowIds: string[];
  rowContentDigests: Record<string, string>;
  failures: PostCutoverRowEvidenceFailure[];
} {
  const dependencySet = new Set(dependencyIds);
  const isDependency = (row: unknown) =>
    isRecord(row) && typeof row.id === 'string' && dependencySet.has(row.id);
  const dependencies = verifyCompactionDependencyRows(
    dependencyIds,
    remoteValues.filter(isDependency)
  );
  const failures = [...dependencies.failures];
  const retained = indexRows(retainedValues, 'retained', failures);
  const remote = indexRows(
    remoteValues.filter((row) => !isDependency(row)),
    'remote',
    failures
  );
  const expectedIdSet = new Set(expectedIds);
  const hasExactSet = (rows: Map<string, EvidenceRow>) =>
    rows.size === expectedIdSet.size && [...rows.keys()].every((rowId) => expectedIdSet.has(rowId));

  if (!hasExactSet(retained)) failures.push({ code: 'retained_row_set_mismatch' });
  if (!hasExactSet(remote)) failures.push({ code: 'remote_row_set_mismatch' });

  const rowContentDigests: Record<string, string> = {};
  for (const rowId of expectedIds) {
    const retainedRow = retained.get(rowId);
    const remoteRow = remote.get(rowId);
    if (!retainedRow || !remoteRow) continue;
    if (retainedRow.status !== 'approved' || retainedRow.is_public !== true) {
      failures.push({ code: 'retained_row_not_approved_public', rowId });
    }
    if (remoteRow.status !== 'synced' || remoteRow.is_public !== false) {
      failures.push({ code: 'remote_row_not_synced_private', rowId });
    }
    const retainedDigest = createCanonicalCompactionDigest(stableRowContent(retainedRow)).digest;
    const remoteDigest = createCanonicalCompactionDigest(stableRowContent(remoteRow)).digest;
    rowContentDigests[rowId] = retainedDigest;
    if (retainedDigest !== remoteDigest) {
      failures.push({ code: 'retained_row_content_mismatch', rowId });
    }
  }

  return {
    proven: failures.length === 0,
    verifiedDependencyRowIds: dependencies.verifiedRowIds,
    rowContentDigests,
    failures,
  };
}

export function verifyStablePostCutoverProduction(
  before: PostCutoverProductionProof,
  after: PostCutoverProductionProof,
  expectedArtifact: Omit<CompactionArtifactMetadata, 'deploymentIdentity'>
): { proven: boolean; failures: string[] } {
  const failures: string[] = [];
  const beforeArtifact = verifyCompactionArtifactMetadata(
    before.gameDataArtifact,
    expectedArtifact
  );
  const afterArtifact = verifyCompactionArtifactMetadata(after.gameDataArtifact, expectedArtifact);
  failures.push(...beforeArtifact.mismatchedFields.map((field) => `before_${field}_mismatch`));
  failures.push(...afterArtifact.mismatchedFields.map((field) => `after_${field}_mismatch`));
  if (before.deployedCommit !== after.deployedCommit) failures.push('deployed_commit_changed');
  if (before.gameDataArtifact.deploymentIdentity !== after.gameDataArtifact.deploymentIdentity) {
    failures.push('deployment_identity_changed');
  }
  return { proven: failures.length === 0, failures };
}
