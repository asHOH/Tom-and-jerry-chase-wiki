import {
  filterAutocompleteCandidates,
  getEditableAutocompleteCandidates,
  type EditableAutocompleteCandidate,
} from './editableAutocomplete';

jest.mock('@/lib/edit/activeEditSession', () => ({
  requireActiveEditSession: () => ({
    readDomain: (domain: string) => {
      if (domain === 'characters') {
        return { 汤姆: { id: '汤姆', skills: [{ name: '怒吼' }] } };
      }
      if (domain === 'items') {
        return { 汤姆: { name: '汤姆' }, 道具键: { name: ' 奶酪 ', id: 'cheese' } };
      }
      if (domain === 'achievements' || domain === 'specialSkills') {
        return { cat: {}, mouse: {} };
      }
      return {};
    },
  }),
}));

it('builds deduplicated candidates with pinyin and reuses the cached result', async () => {
  const pending = getEditableAutocompleteCandidates();
  expect(getEditableAutocompleteCandidates()).toBe(pending);
  const candidates = await pending;

  expect(candidates.filter(({ label }) => label === '汤姆')).toEqual([
    {
      label: '汤姆',
      insertText: '汤姆',
      source: '角色',
      pinyin: 'tangmu',
      pinyinInitials: 'tm',
    },
  ]);
  expect(candidates).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ label: '怒吼', source: '技能' }),
      expect.objectContaining({ label: '道具键', source: '道具' }),
      expect.objectContaining({ label: '奶酪', insertText: '奶酪', source: '道具' }),
      expect.objectContaining({ label: 'cheese', source: '道具' }),
    ])
  );
  expect(filterAutocompleteCandidates(candidates, " TANG ' MU ")[0]?.label).toBe('汤姆');
  expect(filterAutocompleteCandidates(candidates, 'TM')[0]?.label).toBe('汤姆');
  expect(filterAutocompleteCandidates(candidates, '汤')[0]?.label).toBe('汤姆');
});

it('ranks prefixes before substrings, breaks ties by label, and limits results without mutation', () => {
  const candidate = (
    label: string,
    pinyin = '',
    pinyinInitials = ''
  ): EditableAutocompleteCandidate => ({
    label,
    insertText: label,
    source: '道具',
    pinyin,
    pinyinInitials,
  });
  const ranked = [
    candidate('ab-a'),
    candidate('ab-b'),
    candidate('c', 'ab'),
    candidate('d', '', 'ab'),
    candidate('e-ab'),
    candidate('f', 'zab'),
    candidate('g', '', 'zab'),
  ];
  const input = [...ranked].reverse();
  expect(filterAutocompleteCandidates(input, 'AB')).toEqual(ranked);
  expect(input).toEqual([...ranked].reverse());
  expect(filterAutocompleteCandidates(input, 'missing')).toEqual([]);

  const many = Array.from({ length: 15 }, (_, index) => candidate(`ab-${index}`));
  expect(filterAutocompleteCandidates(many, " ' ")).toEqual(many.slice(0, 12));
  expect(filterAutocompleteCandidates(many, 'ab')).toHaveLength(12);
});
