/** @jest-environment node */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';

import { GET } from './route';

const mockGetClaims = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims: () => mockGetClaims() } }),
}));

const generator = path.resolve('scripts/generate-site-images.mjs');
const fixturePrefix = path.join(tmpdir(), 'tjwiki-site-images-');
let fixtureRoot: string;

function generateIndex() {
  const result = spawnSync(process.execPath, [generator], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
  expect({ status: result.status, error: result.error, stderr: result.stderr }).toEqual({
    status: 0,
    error: undefined,
    stderr: '',
  });
}

async function request(relativePath = '') {
  const input = new NextRequest(
    `http://localhost/api/site-images?path=${encodeURIComponent(relativePath)}`
  );
  const cwd = jest.spyOn(process, 'cwd').mockReturnValue(fixtureRoot);
  try {
    return await GET(input);
  } finally {
    cwd.mockRestore();
  }
}

beforeAll(() => {
  fixtureRoot = mkdtempSync(fixturePrefix);
  const imageRoot = path.join(fixtureRoot, 'public', 'images');
  for (const directory of ['图库/空目录', '图库/深层', 'map-tiles/map/0', '__proto__']) {
    mkdirSync(path.join(imageRoot, directory), { recursive: true });
  }
  for (const file of [
    'icon.svg',
    'notes.txt',
    '图库/汤姆.PNG',
    '图库/汤姆.webp',
    '图库/汤姆.avif',
    '图库/深层/隐藏.png',
    'map-tiles/map/0/0.webp',
  ]) {
    writeFileSync(path.join(imageRoot, file), 'image contents are not part of the index');
  }
  generateIndex();
});

beforeEach(() => {
  mockGetClaims.mockResolvedValue({ data: { claims: { sub: 'editor' } } });
});

afterAll(() => {
  expect(path.resolve(fixtureRoot).startsWith(fixturePrefix)).toBe(true);
  rmSync(fixtureRoot, { recursive: true, force: true });
});

it('serves the same immediate folders and image choices from a filenames-only deployment', async () => {
  const index = readFileSync(path.join(fixtureRoot, '.site-images-index.json'), 'utf8');
  expect(index).not.toContain('image contents are not part of the index');

  // A serverless function needs only the generated index, not the public image tree.
  const imageRoot = path.resolve(fixtureRoot, 'public', 'images');
  expect(imageRoot.startsWith(`${path.resolve(fixtureRoot)}${path.sep}`)).toBe(true);
  rmSync(imageRoot, { recursive: true });

  const root = await request();
  expect(root.status).toBe(200);
  const rootBody = await root.json();
  expect(rootBody).toMatchObject({ basePath: '/images', currentPath: '', parentPath: null });
  expect(rootBody.entries.map((entry: { name: string }) => entry.name)).toEqual(
    ['图库', '__proto__', 'map-tiles', 'icon.svg'].sort((a, b) =>
      a === 'icon.svg' ? 1 : b === 'icon.svg' ? -1 : a.localeCompare(b, 'zh-CN')
    )
  );

  const response = await request('图库');
  const body = await response.json();
  expect(body).toMatchObject({ currentPath: '图库', parentPath: '' });
  expect(body.entries.map((entry: { name: string }) => entry.name)).toEqual([
    ...['空目录', '深层'].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    ...['汤姆.PNG', '汤姆.webp', '汤姆.avif'].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  ]);
  expect(body.entries).toContainEqual({
    name: '汤姆.webp',
    type: 'file',
    path: '图库/汤姆.webp',
    publicPath: '/images/图库/汤姆.webp',
  });
  expect(await (await request('图库/空目录')).json()).toMatchObject({
    entries: [],
    parentPath: '图库',
  });
  expect(await (await request('map-tiles/map/0')).json()).toMatchObject({
    entries: [{ name: '0.webp', publicPath: '/images/map-tiles/map/0/0.webp' }],
  });
  expect(await (await request('图库/../图库/')).json()).toMatchObject({ currentPath: '图库/' });
});

it('preserves authentication and rejects traversal, missing folders and file paths', async () => {
  mockGetClaims.mockResolvedValueOnce({ data: null });
  expect((await request()).status).toBe(401);
  for (const invalid of ['../secret', '图库/../../secret', '..\\secret', 'C:\\secret']) {
    expect((await request(invalid)).status).toBe(403);
  }
  expect((await request('missing')).status).toBe(404);
  expect((await request('notes.txt')).status).toBe(400);
  expect((await request('图库/汤姆.PNG')).status).toBe(400);
});

it('reports a missing deployment index as a server error', async () => {
  rmSync(path.join(fixtureRoot, '.site-images-index.json'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const response = await request();
  expect(response.status).toBe(500);
  expect(log).toHaveBeenCalledWith(
    'Failed to read site image index',
    expect.objectContaining({ code: 'ENOENT' })
  );
});
