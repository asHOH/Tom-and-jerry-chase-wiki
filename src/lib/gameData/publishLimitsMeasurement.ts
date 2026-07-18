import { decodeStoredActionRow } from './actionRowDecoder';

export type PublishLimitMeasurementRow = {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
  created_by: string | null;
  message: string | null;
};

type Distribution = {
  p50: number;
  p95: number;
  p99: number;
  max: number;
};

export type SanitizedPublishLimitMeasurement = {
  runFingerprint: string;
  rowCount: number;
  decodableRowCount: number;
  malformedRowCount: number;
  storedEntryBytes: Distribution;
  flattenedActionsPerRow: Distribution;
  pathCharacters: Distribution;
  pathBytes: Distribution;
  messageCharacters: Distribution;
  messageBytes: Distribution;
  heuristicSubmissionGroups: {
    groupCount: number;
    topLevelEntries: Distribution;
    flattenedActions: Distribution;
    reconstructedRequestBytes: Distribution;
  };
};

const textEncoder = new TextEncoder();

function jsonBytes(value: unknown): number {
  return textEncoder.encode(JSON.stringify(value)).byteLength;
}

function textBytes(value: string): number {
  return textEncoder.encode(value).byteLength;
}

function distribution(values: readonly number[]): Distribution {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0 };
  const sorted = [...values].sort((left, right) => left - right);
  const percentile = (percentage: number): number =>
    sorted[Math.max(0, Math.ceil((percentage / 100) * sorted.length) - 1)]!;

  return {
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    max: sorted.at(-1)!,
  };
}

function groupKey(row: PublishLimitMeasurementRow): string {
  return JSON.stringify([row.created_at, row.created_by, row.entity_type]);
}

export function createSanitizedPublishLimitMeasurement(
  rows: readonly PublishLimitMeasurementRow[],
  runFingerprint: string
): SanitizedPublishLimitMeasurement {
  const storedEntryBytes: number[] = [];
  const flattenedActionsPerRow: number[] = [];
  const pathCharacters: number[] = [];
  const pathBytes: number[] = [];
  const messageCharacters: number[] = [];
  const messageBytes: number[] = [];
  const heuristicGroups = new Map<string, PublishLimitMeasurementRow[]>();
  const actionCountByRow = new Map<PublishLimitMeasurementRow, number>();
  let decodableRowCount = 0;

  for (const row of rows) {
    storedEntryBytes.push(jsonBytes(row.entry));
    const message = row.message ?? '';
    messageCharacters.push(message.length);
    messageBytes.push(textBytes(message));

    const group = heuristicGroups.get(groupKey(row));
    if (group) group.push(row);
    else heuristicGroups.set(groupKey(row), [row]);

    const decoded = decodeStoredActionRow(row);
    if (!decoded.success) continue;
    decodableRowCount += 1;
    flattenedActionsPerRow.push(decoded.value.actions.length);
    actionCountByRow.set(row, decoded.value.actions.length);
    for (const action of decoded.value.actions) {
      pathCharacters.push(action.path.length);
      pathBytes.push(textBytes(action.path));
    }
  }

  const topLevelEntries: number[] = [];
  const flattenedActions: number[] = [];
  const reconstructedRequestBytes: number[] = [];
  for (const group of heuristicGroups.values()) {
    topLevelEntries.push(group.length);
    flattenedActions.push(
      group.reduce((total, row) => total + (actionCountByRow.get(row) ?? 0), 0)
    );
    const first = group[0]!;
    reconstructedRequestBytes.push(
      jsonBytes({
        entityType: first.entity_type,
        entries: group.map((row) => row.entry),
        ...(first.message === null ? {} : { message: first.message }),
      })
    );
  }

  return {
    runFingerprint,
    rowCount: rows.length,
    decodableRowCount,
    malformedRowCount: rows.length - decodableRowCount,
    storedEntryBytes: distribution(storedEntryBytes),
    flattenedActionsPerRow: distribution(flattenedActionsPerRow),
    pathCharacters: distribution(pathCharacters),
    pathBytes: distribution(pathBytes),
    messageCharacters: distribution(messageCharacters),
    messageBytes: distribution(messageBytes),
    heuristicSubmissionGroups: {
      groupCount: heuristicGroups.size,
      topLevelEntries: distribution(topLevelEntries),
      flattenedActions: distribution(flattenedActions),
      reconstructedRequestBytes: distribution(reconstructedRequestBytes),
    },
  };
}
