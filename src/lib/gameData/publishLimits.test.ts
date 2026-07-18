import { PUBLISH_LIMITS } from './publishLimits';

describe('PUBLISH_LIMITS', () => {
  it('freezes measured production maxima with at least four-times headroom', () => {
    expect(PUBLISH_LIMITS).toEqual({
      requestBytes: 1048576,
      topLevelEntries: 512,
      flattenedActions: 512,
      actionsPerRow: 128,
      pathCharacters: 256,
      messageCharacters: 1024,
    });
    expect(Object.isFrozen(PUBLISH_LIMITS)).toBe(true);

    expect(PUBLISH_LIMITS.requestBytes).toBeGreaterThanOrEqual(158157 * 4);
    expect(PUBLISH_LIMITS.topLevelEntries).toBeGreaterThanOrEqual(100 * 4);
    expect(PUBLISH_LIMITS.flattenedActions).toBeGreaterThanOrEqual(100 * 4);
    expect(PUBLISH_LIMITS.actionsPerRow).toBeGreaterThanOrEqual(26 * 4);
    expect(PUBLISH_LIMITS.pathCharacters).toBeGreaterThanOrEqual(48 * 4);
    expect(PUBLISH_LIMITS.messageCharacters).toBeGreaterThanOrEqual(239 * 4);
  });
});
