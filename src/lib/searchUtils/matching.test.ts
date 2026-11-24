import type { convertToPinyin } from '../pinyinUtils';
import type { createSearchQuery } from './matching';

jest.mock('../pinyinUtils', () => ({ convertToPinyin: jest.fn() }));

let convert: jest.MockedFunction<typeof convertToPinyin>;
let query: typeof createSearchQuery;

beforeEach(() => {
  jest.resetModules();
  convert = jest.requireMock('../pinyinUtils').convertToPinyin;
  convert.mockResolvedValue('tangmu');
  query = jest.requireActual('./matching').createSearchQuery;
});

it('shares pending conversions across queries and reuses the result', async () => {
  let resolve!: (value: string) => void;
  convert.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  const first = query('tang').matchFields([['汤姆', 'name']]);
  const second = query('mu').matchFields([['汤姆', 'name']]);
  expect(convert).toHaveBeenCalledTimes(1);
  resolve('tangmu');
  await expect(first).resolves.toMatchObject({ isPinyinMatch: true });
  await expect(second).resolves.toMatchObject({ isPinyinMatch: true });
  await expect(query('tangmu').matchFields([['汤姆', 'name']])).resolves.toMatchObject({
    priority: 41,
    highlightRanges: [],
  });
  expect(convert).toHaveBeenCalledTimes(1);
});

it('keys conversions by exact text so updated published fields are searched', async () => {
  convert.mockResolvedValueOnce('tangmu').mockResolvedValueOnce('jierui');
  await query('tangmu').matchFields([['汤姆', 'name']]);
  await expect(query('jierui').matchFields([['杰瑞', 'name']])).resolves.toMatchObject({
    matchContext: '杰瑞',
  });
  expect(convert.mock.calls).toEqual([['汤姆'], ['杰瑞']]);
});

it('does not convert literal matches', async () => {
  await expect(query('汤姆').matchFields([['汤姆', 'name']])).resolves.toMatchObject({
    isPinyinMatch: false,
    priority: 43,
  });
  expect(convert).not.toHaveBeenCalled();
});

it('retries a rejected conversion', async () => {
  convert.mockRejectedValueOnce(new Error('Loading failed'));
  await expect(query('tangmu').matchFields([['汤姆', 'name']])).rejects.toThrow('Loading failed');
  await expect(query('tangmu').matchFields([['汤姆', 'name']])).resolves.toBeDefined();
  expect(convert).toHaveBeenCalledTimes(2);
});

it('evicts old entries when retained source text exceeds the budget', async () => {
  const texts = ['甲', '乙', '丙'].map((text) => text.repeat(400_000));
  for (const text of texts) await query('tangmu').matchFields([[text, 'name']]);
  await query('tangmu').matchFields([[texts[1], 'name']]);
  expect(convert).toHaveBeenCalledTimes(3);
  await query('tangmu').matchFields([[texts[0], 'name']]);
  expect(convert).toHaveBeenCalledTimes(4);
});

it('does not retain oversized fields or evict other entries for them', async () => {
  await query('tangmu').matchFields([['汤姆', 'name']]);
  const oversized = '甲'.repeat(1_000_001);
  await query('tangmu').matchFields([[oversized, 'detail']]);
  await query('tangmu').matchFields([[oversized, 'detail']]);
  await query('tangmu').matchFields([['汤姆', 'name']]);
  expect(convert).toHaveBeenCalledTimes(3);
});
