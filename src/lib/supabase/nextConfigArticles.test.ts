import nextConfig from '../../../next.config';

type RewriteEntry = {
  source: string;
  destination: string;
};

const originalEnv = { ...process.env };

const getRewrites = async (): Promise<RewriteEntry[]> => {
  const rewrites = await nextConfig.rewrites?.();
  if (!Array.isArray(rewrites)) {
    throw new Error('Expected next.config rewrites to return an array');
  }
  return rewrites as RewriteEntry[];
};

const hasArticle404Rewrite = (rewrites: RewriteEntry[]) =>
  rewrites.some(
    (rewrite) =>
      rewrite.destination === '/404' &&
      (rewrite.source === '/articles' ||
        rewrite.source === '/articles/:path*' ||
        rewrite.source === '/api/articles' ||
        rewrite.source === '/api/articles/:path*')
  );

describe('next.config article rewrites', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should keep article routes enabled with the new Supabase publishable key', async () => {
    process.env.NEXT_PUBLIC_DISABLE_ARTICLES = '0';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const rewrites = await getRewrites();

    expect(hasArticle404Rewrite(rewrites)).toBe(false);
  });
});
