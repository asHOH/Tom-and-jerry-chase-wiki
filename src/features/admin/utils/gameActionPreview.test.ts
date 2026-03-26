import { diffGameActionIdArray, summarizeGameActionValue } from './gameActionPreview';

describe('gameActionPreview', () => {
  describe('summarizeGameActionValue', () => {
    it('summarizes common value shapes for the admin preview', () => {
      expect(summarizeGameActionValue(undefined)).toBe('空');
      expect(summarizeGameActionValue([])).toBe('空数组');
      expect(summarizeGameActionValue([{ id: 'A' }, { id: 'B' }])).toBe('数组(2)');
      expect(summarizeGameActionValue({ a: 1, b: 2 })).toBe('对象(2键)');
    });
  });

  describe('diffGameActionIdArray', () => {
    it('reports every changed item in an id-keyed relation array', () => {
      const diff = diffGameActionIdArray(
        [
          { id: '马索尔', isMinor: false, description: '' },
          { id: '梦游杰瑞', isMinor: false, description: '旧描述' },
          { id: '恶魔泰菲', isMinor: true, description: '保留不变' },
        ],
        [
          { id: '马索尔', isMinor: false, description: '新描述' },
          { id: '梦游杰瑞', isMinor: false, description: '更新后的描述' },
          { id: '恶魔泰菲', isMinor: true, description: '保留不变' },
        ]
      );

      expect(diff.enabled).toBe(true);
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
      expect(diff.changed).toEqual([
        { id: '马索尔', fields: ['description'] },
        { id: '梦游杰瑞', fields: ['description'] },
      ]);
    });

    it('tracks nested field changes instead of collapsing them to the parent key', () => {
      const diff = diffGameActionIdArray(
        [{ id: '罗宾汉杰瑞', metadata: { description: '旧', tags: ['A'] } }],
        [{ id: '罗宾汉杰瑞', metadata: { description: '新', tags: ['B'] } }]
      );

      expect(diff.changed).toEqual([
        { id: '罗宾汉杰瑞', fields: ['metadata.description', 'metadata.tags[0]'] },
      ]);
    });

    it('returns disabled when neither side is an id-keyed array', () => {
      expect(diffGameActionIdArray('before', 'after')).toEqual({
        added: [],
        removed: [],
        changed: [],
        enabled: false,
      });
    });
  });
});
