import { clampColumns, getVirtualGridColumns } from '@/components/ui/VirtualGrid';

describe('VirtualGrid helpers', () => {
  describe('clampColumns', () => {
    it('returns 1 for non-finite and non-positive values', () => {
      expect(clampColumns(Number.NaN)).toBe(1);
      expect(clampColumns(0)).toBe(1);
      expect(clampColumns(-3)).toBe(1);
    });

    it('floors finite positive values', () => {
      expect(clampColumns(1)).toBe(1);
      expect(clampColumns(2.9)).toBe(2);
    });
  });

  describe('getVirtualGridColumns', () => {
    it('prioritizes fixedColumns when positive', () => {
      expect(
        getVirtualGridColumns({
          containerWidth: 900,
          minItemWidth: 200,
          gapPx: 16,
          fixedColumns: 4,
        })
      ).toBe(4);
    });

    it('returns 1 when container width is not positive', () => {
      expect(
        getVirtualGridColumns({
          containerWidth: 0,
          minItemWidth: 200,
          gapPx: 16,
        })
      ).toBe(1);
    });

    it('matches existing gap-aware column estimation', () => {
      expect(
        getVirtualGridColumns({
          containerWidth: 1000,
          minItemWidth: 200,
          gapPx: 20,
        })
      ).toBe(4);

      expect(
        getVirtualGridColumns({
          containerWidth: 640,
          minItemWidth: 200,
          gapPx: 32,
        })
      ).toBe(2);
    });
  });
});
