import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSupabaseTarget } from './supabase-target.mjs';

test('resolves hosted project references and normalizes hosts while preserving ports', () => {
  assert.deepEqual(resolveSupabaseTarget('https://project.supabase.co'), {
    host: 'project.supabase.co',
    projectRef: 'project',
  });
  assert.deepEqual(
    resolveSupabaseTarget('https://Project.Supabase.Co:8443/rest/v1?key=value#fragment'),
    { host: 'project.supabase.co:8443', projectRef: 'project' }
  );
});

test('keeps self-hosted targets separate from hosted project references', () => {
  for (const [url, host] of [
    ['http://127.0.0.1:54321', '127.0.0.1:54321'],
    ['http://[::1]:54321', '[::1]:54321'],
    ['https://DB.Example.com', 'db.example.com'],
    ['https://supabase.co', 'supabase.co'],
    ['https://project.supabase.co.example.com', 'project.supabase.co.example.com'],
  ]) {
    assert.deepEqual(resolveSupabaseTarget(url), { host, projectRef: null }, url);
  }
});

test('rejects malformed URLs, unsupported protocols, and embedded credentials', () => {
  for (const url of [
    '',
    'invalid',
    'project.supabase.co',
    'https://',
    'ftp://project.supabase.co',
    'file:///tmp/supabase',
    'https://user@project.supabase.co',
    'https://:password@project.supabase.co',
  ]) {
    assert.equal(resolveSupabaseTarget(url), null, url);
  }
});
