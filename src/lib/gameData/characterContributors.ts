import 'server-only';

import { createHash } from 'node:crypto';

import { isHiddenContributorNickname } from '@/data/hiddenContributorNicknames';

export type CharacterContributor = {
  id: string;
  name: string;
  contributionCount: number;
};

export type CharacterContributorIndex = Record<string, CharacterContributor[]>;

export type CharacterContributorSourceRow = {
  characterId: string;
  contributorId: string;
  nickname: string;
  contributionCount: number;
};

export type CharacterContributorSourcePayload = {
  sourceActionCount: number;
  rowCount: number;
  rows: CharacterContributorSourceRow[];
};

export type CharacterContributorArtifactPayload = {
  sourceActionCount: number;
  characterCount: number;
  checksum: string;
  index: CharacterContributorIndex;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actualKeys = Object.keys(value).sort();
  return actualKeys.length === keys.length && actualKeys.every((key, index) => key === keys[index]);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isNonNegativeInteger(value) && value > 0;
}

function parseSourceRow(value: unknown): CharacterContributorSourceRow {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['characterId', 'contributionCount', 'contributorId', 'nickname']) ||
    typeof value.characterId !== 'string' ||
    value.characterId.length === 0 ||
    typeof value.contributorId !== 'string' ||
    !UUID_PATTERN.test(value.contributorId) ||
    typeof value.nickname !== 'string' ||
    value.nickname.length === 0 ||
    value.nickname !== value.nickname.trim() ||
    !isPositiveInteger(value.contributionCount)
  ) {
    throw new Error('invalid_character_contributor_row');
  }

  return {
    characterId: value.characterId,
    contributorId: value.contributorId,
    nickname: value.nickname,
    contributionCount: value.contributionCount,
  };
}

export function parseCharacterContributorSourcePayload(
  value: unknown
): CharacterContributorSourcePayload {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['rowCount', 'rows', 'sourceActionCount']) ||
    !isNonNegativeInteger(value.sourceActionCount) ||
    !isNonNegativeInteger(value.rowCount) ||
    !Array.isArray(value.rows)
  ) {
    throw new Error('invalid_character_contributor_source');
  }

  const rows = value.rows.map(parseSourceRow);
  if (value.rowCount !== rows.length) throw new Error('incomplete_character_contributor_source');

  const pairs = new Set<string>();
  for (const row of rows) {
    const pair = `${row.characterId}\u0000${row.contributorId}`;
    if (pairs.has(pair)) throw new Error('duplicate_character_contributor_row');
    pairs.add(pair);
  }

  return {
    sourceActionCount: value.sourceActionCount,
    rowCount: value.rowCount,
    rows,
  };
}

export function buildCharacterContributorIndex(
  rows: readonly CharacterContributorSourceRow[]
): CharacterContributorIndex {
  const groups = new Map<string, CharacterContributor[]>();
  for (const row of rows) {
    if (isHiddenContributorNickname(row.nickname)) continue;

    const contributors = groups.get(row.characterId) ?? [];
    contributors.push({
      id: row.contributorId,
      name: row.nickname,
      contributionCount: row.contributionCount,
    });
    groups.set(row.characterId, contributors);
  }

  return Object.fromEntries(
    [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([characterId, contributors]) => [
        characterId,
        contributors.sort(
          (left, right) =>
            right.contributionCount - left.contributionCount ||
            left.name.localeCompare(right.name) ||
            left.id.localeCompare(right.id)
        ),
      ])
  );
}

export function filterHiddenCharacterContributors(
  index: CharacterContributorIndex
): CharacterContributorIndex {
  return Object.fromEntries(
    Object.entries(index).flatMap(([characterId, contributors]) => {
      const visibleContributors = contributors.filter(
        ({ name }) => !isHiddenContributorNickname(name)
      );
      return visibleContributors.length > 0 ? [[characterId, visibleContributors]] : [];
    })
  );
}

function canonicalIndexJson(index: CharacterContributorIndex): string {
  return JSON.stringify(
    Object.keys(index)
      .sort((left, right) => left.localeCompare(right))
      .map((characterId) => [
        characterId,
        index[characterId]!.map(({ id, name, contributionCount }) => [id, name, contributionCount]),
      ])
  );
}

function checksumIndex(index: CharacterContributorIndex): string {
  return createHash('sha256').update(canonicalIndexJson(index)).digest('hex');
}

export function createCharacterContributorArtifactPayload(
  source: CharacterContributorSourcePayload
): CharacterContributorArtifactPayload {
  const index = buildCharacterContributorIndex(source.rows);
  return {
    sourceActionCount: source.sourceActionCount,
    characterCount: Object.keys(index).length,
    checksum: checksumIndex(index),
    index,
  };
}

function parseArtifactContributor(value: unknown): CharacterContributor {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['contributionCount', 'id', 'name']) ||
    typeof value.id !== 'string' ||
    !UUID_PATTERN.test(value.id) ||
    typeof value.name !== 'string' ||
    value.name.length === 0 ||
    value.name !== value.name.trim() ||
    !isPositiveInteger(value.contributionCount)
  ) {
    throw new Error('invalid_character_contributor_artifact');
  }
  return { id: value.id, name: value.name, contributionCount: value.contributionCount };
}

export function parseCharacterContributorArtifactPayload(
  value: unknown
): CharacterContributorArtifactPayload {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['characterCount', 'checksum', 'index', 'sourceActionCount']) ||
    !isNonNegativeInteger(value.sourceActionCount) ||
    !isNonNegativeInteger(value.characterCount) ||
    typeof value.checksum !== 'string' ||
    !SHA256_PATTERN.test(value.checksum) ||
    !isRecord(value.index)
  ) {
    throw new Error('invalid_character_contributor_artifact');
  }

  const index = Object.fromEntries(
    Object.entries(value.index).map(([characterId, contributors]) => {
      if (characterId.length === 0 || !Array.isArray(contributors)) {
        throw new Error('invalid_character_contributor_artifact');
      }
      const parsed = contributors.map(parseArtifactContributor);
      if (new Set(parsed.map(({ id }) => id)).size !== parsed.length) {
        throw new Error('duplicate_character_contributor_artifact_row');
      }
      return [characterId, parsed];
    })
  );

  if (
    value.characterCount !== Object.keys(index).length ||
    value.checksum !== checksumIndex(index)
  ) {
    throw new Error('invalid_character_contributor_artifact');
  }

  return {
    sourceActionCount: value.sourceActionCount,
    characterCount: value.characterCount,
    checksum: value.checksum,
    index,
  };
}
