import { diffGameActionIdArray, summarizeGameActionValue } from './gameActionPreview';

describe('gameActionPreview', () => {
  describe('summarizeGameActionValue', () => {
    it('summarizes common value shapes for the admin preview', () => {
      expect(summarizeGameActionValue(undefined)).toBe('空');
      expect(summarizeGameActionValue([])).toBe('空数组');
      expect(summarizeGameActionValue([{ id: 'A' }, { id: 'B' }])).toBe('数组(2: A、B)');
      expect(summarizeGameActionValue({ a: 1, b: 2 })).toBe('对象(2键)');
    });

    it('includes recognizable labels for keyed object arrays', () => {
      expect(
        summarizeGameActionValue([
          { tagName: '辅助', description: 'A' },
          { tagName: '砸墙', description: 'B' },
          { tagName: '奶酪', description: 'C' },
        ])
      ).toBe('数组(3: 辅助、砸墙、奶酪)');
    });
  });

  describe('diffGameActionIdArray', () => {
    it('reports every changed item in an id-keyed relation array', () => {
      const diff = diffGameActionIdArray(
        [
          { id: '玛索尔', isMinor: false, description: '' },
          { id: '梦游杰瑞', isMinor: false, description: '旧描述' },
          { id: '恶魔泰菲', isMinor: true, description: '保持不变' },
        ],
        [
          { id: '玛索尔', isMinor: false, description: '新描述' },
          { id: '梦游杰瑞', isMinor: false, description: '更新后的描述' },
          { id: '恶魔泰菲', isMinor: true, description: '保持不变' },
        ]
      );

      expect(diff.enabled).toBe(true);
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
      expect(diff.changed).toEqual([
        { id: '玛索尔', fields: ['description'] },
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

    it('supports arrays keyed by tagName for preview diffs', () => {
      const diff = diffGameActionIdArray(
        [
          {
            tagName: '辅助',
            description: '保持不变',
            additionalDescription: '',
          },
          {
            tagName: '奶酪',
            description: '旧描述',
            additionalDescription: '新增标签介绍',
          },
        ],
        [
          {
            tagName: '辅助',
            description: '保持不变',
            additionalDescription: '',
          },
          {
            tagName: '奶酪',
            description: '新描述',
            additionalDescription: '新增标签介绍',
          },
        ]
      );

      expect(diff).toEqual({
        added: [],
        removed: [],
        changed: [{ id: '奶酪', fields: ['description'] }],
        enabled: true,
      });
    });

    it('returns disabled when neither side is a keyed object array', () => {
      expect(diffGameActionIdArray('before', 'after')).toEqual({
        added: [],
        removed: [],
        changed: [],
        enabled: false,
      });
    });
  });
});
