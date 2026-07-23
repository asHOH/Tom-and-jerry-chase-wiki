import nextConfig from '../../../../next.config';

jest.mock('server-only', () => ({}), { virtual: true });

describe('production build identity', () => {
  it('uses one exact opaque value for generateBuildId and the embedded server constant', async () => {
    const generated = await nextConfig.generateBuildId?.();
    const previousEmbeddedIdentity = process.env.TJWIKI_BUILD_IDENTITY;
    process.env.TJWIKI_BUILD_IDENTITY = nextConfig.env?.TJWIKI_BUILD_IDENTITY;
    try {
      const { PRODUCTION_BUILD_IDENTITY } = await import('./buildIdentity');

      expect(generated).toBe(nextConfig.env?.TJWIKI_BUILD_IDENTITY);
      expect(PRODUCTION_BUILD_IDENTITY).toBe(generated);
      expect(generated).toEqual(expect.any(String));
      expect(generated).not.toHaveLength(0);
    } finally {
      if (previousEmbeddedIdentity === undefined) {
        delete process.env.TJWIKI_BUILD_IDENTITY;
      } else {
        process.env.TJWIKI_BUILD_IDENTITY = previousEmbeddedIdentity;
      }
    }
  });
});
