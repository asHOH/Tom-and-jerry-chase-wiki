import { readFileSync } from 'node:fs';

const buildScript = readFileSync('scripts/run-build-with-game-data.mjs', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};

describe('shared game-data build wrapper contract', () => {
  it('constructs only a publishable acquisition client', () => {
    expect(buildScript).toContain('createClient(supabaseUrl, publishableKey');
    expect(buildScript).not.toMatch(/SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
    expect(buildScript).not.toMatch(/requireSupabaseAdminClient|getOptionalSupabaseAdminClient/);
  });

  it('wraps every public build command around a private output pipeline', () => {
    expect(packageJson.scripts.build).toContain('run-build-with-game-data.mjs build:output');
    expect(packageJson.scripts['build:skip-images']).toContain(
      'run-build-with-game-data.mjs build:output:skip-images'
    );
    expect(packageJson.scripts['build:output']).toContain('next build');
    expect(packageJson.scripts['build:output']).toContain('serwist build');
    expect(packageJson.scripts['build:output']).toContain('run-image-optimization.cjs');
  });
});
