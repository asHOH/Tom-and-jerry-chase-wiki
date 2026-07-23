import { getRoseSectorAngles } from './PositioningTagsCharts';

describe('getRoseSectorAngles', () => {
  it('centers every sector on the matching tag axis', () => {
    const { axisAngle, startAngle, endAngle } = getRoseSectorAngles(0, 7);

    expect((startAngle + endAngle) / 2).toBeCloseTo(axisAngle);
    expect(startAngle).toBeLessThan(axisAngle);
    expect(endAngle).toBeGreaterThan(axisAngle);
  });
});
