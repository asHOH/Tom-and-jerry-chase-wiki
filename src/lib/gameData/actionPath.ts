const MAX_ARRAY_INDEX = 2 ** 32 - 2;
const MAX_ARRAY_INDEX_BIGINT = BigInt(MAX_ARRAY_INDEX);
const CANONICAL_ARRAY_INDEX = /^(?:0|[1-9][0-9]*)$/;
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

export type ParsedActionPath = {
  path: string;
  segments: readonly string[];
  rootKey: string;
};

export type ActionPathError = {
  code: 'invalid_path' | 'invalid_array_index';
  message: string;
  segment?: string;
  segmentIndex?: number;
};

export type ActionPathResult<T> =
  { success: true; value: T } | { success: false; error: ActionPathError };

export type ResolvedArraySegment =
  { kind: 'index'; index: number } | { kind: 'property'; key: string };

function invalidPath(message: string, segmentIndex?: number): ActionPathResult<never> {
  return {
    success: false,
    error: Object.freeze({
      code: 'invalid_path' as const,
      message,
      ...(segmentIndex === undefined ? {} : { segmentIndex }),
    }),
  };
}

function invalidArrayIndex(segment: string, segmentIndex?: number): ActionPathResult<never> {
  return {
    success: false,
    error: Object.freeze({
      code: 'invalid_array_index' as const,
      message: `Invalid array index segment: ${segment}`,
      segment,
      ...(segmentIndex === undefined ? {} : { segmentIndex }),
    }),
  };
}

export function parseActionPath(rawPath: string): ActionPathResult<ParsedActionPath> {
  const path = rawPath.trim();
  if (path.length === 0) return invalidPath('Action path must not be empty');

  const segments = path.split('.');
  const emptySegmentIndex = segments.findIndex((segment) => segment.trim().length === 0);
  if (emptySegmentIndex !== -1) {
    return invalidPath('Action path contains an empty segment', emptySegmentIndex);
  }

  const unsafeSegmentIndex = segments.findIndex((segment) => UNSAFE_PATH_SEGMENTS.has(segment));
  if (unsafeSegmentIndex !== -1) {
    return invalidPath('Action path contains a prototype-mutating segment', unsafeSegmentIndex);
  }

  return {
    success: true,
    value: Object.freeze({
      path,
      segments: Object.freeze(segments),
      rootKey: segments[0]!,
    }),
  };
}

function looksNumeric(segment: string): boolean {
  if (segment === 'NaN' || segment === 'Infinity' || segment === '-Infinity') return true;
  return segment.length > 0 && Number.isFinite(Number(segment));
}

export function resolveArraySegment(
  segment: string,
  segmentIndex?: number
): ActionPathResult<ResolvedArraySegment> {
  if (CANONICAL_ARRAY_INDEX.test(segment)) {
    const index = BigInt(segment);
    if (index > MAX_ARRAY_INDEX_BIGINT) return invalidArrayIndex(segment, segmentIndex);
    return { success: true, value: { kind: 'index', index: Number(index) } };
  }

  if (looksNumeric(segment)) return invalidArrayIndex(segment, segmentIndex);
  return { success: true, value: { kind: 'property', key: segment } };
}

export function shouldCreateArrayForSegment(
  segment: string,
  segmentIndex?: number
): ActionPathResult<boolean> {
  const resolved = resolveArraySegment(segment, segmentIndex);
  if (!resolved.success) return resolved;
  return { success: true, value: resolved.value.kind === 'index' };
}
