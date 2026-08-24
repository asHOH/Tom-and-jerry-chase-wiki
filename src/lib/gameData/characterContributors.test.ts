import {
  buildCharacterContributorIndex,
  createCharacterContributorArtifactPayload,
  parseCharacterContributorArtifactPayload,
  parseCharacterContributorSourcePayload,
} from './characterContributors';

const contributorA = '11111111-1111-4111-8111-111111111111';
const contributorB = '22222222-2222-4222-8222-222222222222';
const contributorC = '33333333-3333-4333-8333-333333333333';
const hiddenContributor = '44444444-4444-4444-8444-444444444444';

const sourceValue = {
  sourceActionCount: 8,
  rowCount: 5,
  rows: [
    {
      characterId: '汤姆',
      contributorId: contributorA,
      nickname: '乙',
      contributionCount: 1,
    },
    {
      characterId: '汤姆',
      contributorId: contributorB,
      nickname: '甲',
      contributionCount: 3,
    },
    {
      characterId: '汤姆',
      contributorId: contributorC,
      nickname: '丙',
      contributionCount: 3,
    },
    {
      characterId: '__proto__',
      contributorId: contributorA,
      nickname: '安全键',
      contributionCount: 1,
    },
    {
      characterId: '汤姆',
      contributorId: hiddenContributor,
      nickname: 'TJAI',
      contributionCount: 10,
    },
  ],
};

describe('character contributor payloads', () => {
  it('validates and indexes the derived rows deterministically', () => {
    const source = parseCharacterContributorSourcePayload(sourceValue);
    const index = buildCharacterContributorIndex([...source.rows].reverse());

    expect(index['汤姆']).toEqual([
      { id: contributorC, name: '丙', contributionCount: 3 },
      { id: contributorB, name: '甲', contributionCount: 3 },
      { id: contributorA, name: '乙', contributionCount: 1 },
    ]);
    expect(Object.hasOwn(index, '__proto__')).toBe(true);
    expect(index['__proto__']).toEqual([
      { id: contributorA, name: '安全键', contributionCount: 1 },
    ]);
  });

  it.each([
    { ...sourceValue, rowCount: 6 },
    { ...sourceValue, privateField: 'must-fail' },
    { ...sourceValue, rows: [...sourceValue.rows, sourceValue.rows[0]] },
    {
      ...sourceValue,
      rows: [{ ...sourceValue.rows[0], nickname: ' padded ' }],
      rowCount: 1,
    },
    {
      ...sourceValue,
      rows: [{ ...sourceValue.rows[0], actionId: 'must-fail' }],
      rowCount: 1,
    },
  ])('rejects malformed, incomplete, duplicate, or over-wide source payloads', (value) => {
    expect(() => parseCharacterContributorSourcePayload(value)).toThrow();
  });

  it('creates and verifies the compact artifact payload checksum', () => {
    const source = parseCharacterContributorSourcePayload(sourceValue);
    const artifact = createCharacterContributorArtifactPayload(source);

    expect(artifact.sourceActionCount).toBe(8);
    expect(artifact.characterCount).toBe(2);
    expect(artifact.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(artifact)).not.toContain('TJAI');
    expect(parseCharacterContributorArtifactPayload(artifact)).toEqual(artifact);

    expect(() =>
      parseCharacterContributorArtifactPayload({
        ...artifact,
        index: {
          ...artifact.index,
          汤姆: artifact.index['汤姆']!.map((row, index) =>
            index === 0 ? { ...row, contributionCount: row.contributionCount + 1 } : row
          ),
        },
      })
    ).toThrow('invalid_character_contributor_artifact');
  });
});
