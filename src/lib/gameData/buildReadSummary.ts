export type BuildReadMode = 'disabled' | 'enabled';
export type BuildBulkSourceName = 'approved-actions' | 'character-contributors' | 'synced-history';

const BULK_SOURCES = ['approved-actions', 'character-contributors', 'synced-history'] as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type BuildBulkSourceMeasurement = {
  source: BuildBulkSourceName;
  fetchCount: number;
  rowCount: number;
  serializedBytes: number;
  durationMs: number;
  checksum: string | null;
};

export type BuildReadSummaryInput = {
  attempt: number;
  mode: BuildReadMode;
  sources: BuildBulkSourceMeasurement[];
  epochValidation: {
    checkCount: number;
    durationMs: number;
  };
};

export type BuildReadSummary = {
  kind: 'build-game-data-read-summary';
  attempt: number;
  mode: BuildReadMode;
  sources: BuildBulkSourceMeasurement[];
  epochValidation: {
    checkCount: number;
    durationMs: number;
  };
};

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function copyAndValidateMeasurement(
  measurement: BuildBulkSourceMeasurement
): BuildBulkSourceMeasurement {
  if (
    !BULK_SOURCES.includes(measurement.source) ||
    !isNonNegativeInteger(measurement.fetchCount) ||
    !isNonNegativeInteger(measurement.rowCount) ||
    !isNonNegativeInteger(measurement.serializedBytes) ||
    !isNonNegativeInteger(measurement.durationMs) ||
    (measurement.checksum !== null && !SHA256_PATTERN.test(measurement.checksum))
  ) {
    throw new Error('invalid_build_read_measurement');
  }

  return {
    source: measurement.source,
    fetchCount: measurement.fetchCount,
    rowCount: measurement.rowCount,
    serializedBytes: measurement.serializedBytes,
    durationMs: measurement.durationMs,
    checksum: measurement.checksum,
  };
}

export function createBuildReadSummary(input: BuildReadSummaryInput): BuildReadSummary {
  if (
    !Number.isSafeInteger(input.attempt) ||
    input.attempt < 1 ||
    !['disabled', 'enabled'].includes(input.mode) ||
    !isNonNegativeInteger(input.epochValidation.checkCount) ||
    !isNonNegativeInteger(input.epochValidation.durationMs)
  ) {
    throw new Error('invalid_build_read_summary');
  }

  const measurements = input.sources.map(copyAndValidateMeasurement);
  if (
    measurements.length !== BULK_SOURCES.length ||
    new Set(measurements.map(({ source }) => source)).size !== BULK_SOURCES.length
  ) {
    throw new Error('invalid_build_read_sources');
  }

  for (const source of BULK_SOURCES) {
    const measurement = measurements.find((candidate) => candidate.source === source)!;
    const expectedFetchCount = input.mode === 'enabled' ? 1 : 0;
    if (measurement.fetchCount !== expectedFetchCount) {
      throw new Error('build_read_budget_exceeded');
    }
    if (
      input.mode === 'disabled' &&
      (measurement.rowCount !== 0 ||
        measurement.serializedBytes !== 0 ||
        measurement.checksum !== null)
    ) {
      throw new Error('invalid_disabled_build_measurement');
    }
    if (input.mode === 'enabled' && measurement.checksum === null) {
      throw new Error('invalid_enabled_build_measurement');
    }
  }

  return {
    kind: 'build-game-data-read-summary',
    attempt: input.attempt,
    mode: input.mode,
    sources: measurements,
    epochValidation: {
      checkCount: input.epochValidation.checkCount,
      durationMs: input.epochValidation.durationMs,
    },
  };
}
