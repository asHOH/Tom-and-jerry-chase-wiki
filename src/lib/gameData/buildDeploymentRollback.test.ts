import { readFileSync } from 'node:fs';

const deployScript = readFileSync('scripts/ops/deploy_server.sh', 'utf8');

describe('VPS build rollback contract', () => {
  it('preserves a verified source revision and build before stopping production', () => {
    expect(deployScript).toContain('preserve_last_known_good_release()');
    expect(deployScript).toContain('check_health_endpoint "$health_url"');
    expect(deployScript).toContain('check_version_endpoint "$version_url" "$PREVIOUS_SOURCE_HASH"');
    expect(deployScript).toContain('cp -a .next "$LAST_KNOWN_GOOD_DIR/.next"');
    expect(deployScript.indexOf('preserve_last_known_good_release\n')).toBeLessThan(
      deployScript.lastIndexOf('stop_pm2_process_for_build\n')
    );
  });

  it('arms an exit trap that restores source, output, dependencies, and PM2', () => {
    expect(deployScript).toContain('trap handle_exit EXIT');
    expect(deployScript).toContain('git reset --hard "$rollback_hash"');
    expect(deployScript).toContain('cp -a "$LAST_KNOWN_GOOD_DIR/.next" "$REPO_ROOT/.next"');
    expect(deployScript).toMatch(
      /restore_last_known_good_release\(\)[\s\S]*?install_dependencies[\s\S]*?ensure_pm2_process/
    );
    expect(deployScript).toContain(
      'Automatic rollback succeeded; production is serving ${rollback_hash:0:8}.'
    );
  });
});
