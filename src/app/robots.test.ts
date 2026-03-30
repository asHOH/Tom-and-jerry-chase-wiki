describe('robots', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should advertise both sitemaps in production', async () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';

    const { default: robots } = await import('./robots');
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    });
    expect(result.sitemap).toEqual([
      'https://tjwiki.com/sitemap.xml',
      'https://tjwiki.com/articles/sitemap.xml',
    ]);
  });

  it('should hide sitemap and disallow crawling in vercel preview', async () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';

    const { default: robots } = await import('./robots');
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      disallow: '/',
    });
    expect(result.sitemap).toBeUndefined();
  });
});
