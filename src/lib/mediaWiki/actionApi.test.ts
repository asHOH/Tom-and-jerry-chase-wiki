/** @jest-environment node */

import { getCachedPublicUserProfile, type PublicUserProfile } from '@/lib/users/publicProfile';

import { handleMediaWikiGet, handleMediaWikiOptions } from './actionApi';
import {
  getMediaWikiCatalog,
  getMediaWikiPageById,
  lookupMediaWikiPage,
  searchMediaWikiCatalog,
  type MediaWikiCatalog,
  type MediaWikiPage,
} from './catalog';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/users/publicProfile', () => ({ getCachedPublicUserProfile: jest.fn() }));
jest.mock('./catalog', () => ({
  getMediaWikiCatalog: jest.fn(),
  getMediaWikiPageById: jest.fn(),
  lookupMediaWikiPage: jest.fn(),
  searchMediaWikiCatalog: jest.fn(),
}));

const page: MediaWikiPage = {
  pageid: 1,
  kind: 'character',
  title: '汤姆',
  route: '/characters/tom/',
  fullUrl: 'https://www.tjwiki.com/characters/tom/',
  canonicalUrl: 'https://www.tjwiki.com/characters/tom/',
  description: '猫阵营角色',
  extract: '汤姆是猫阵营角色。',
  aliases: ['Tom'],
  sections: [],
  categoryLabel: '角色',
  kindDescription: '猫阵营角色',
};
const catalog: MediaWikiCatalog = {
  pages: [page],
  articlePages: [page],
  pagesById: new Map([[1, page]]),
  pagesByRoute: new Map([[page.route, page]]),
  pagesByTitle: new Map([[page.title, page]]),
  pagesByName: new Map([[page.title, [page]]]),
};
const profile: PublicUserProfile = {
  id: 'c44c9634-cf9d-41f0-8f83-7993fbff4913',
  nickname: '测试用户',
  groups: ['编辑者', '管理员'],
  registeredAt: '2026-07-01T08:00:00.000Z',
  reviewCount: 9,
  contributionTotals: { articles: 2, gameData: 3, all: 5 },
  recentContributions: [],
};
const getProfileMock = jest.mocked(getCachedPublicUserProfile);
const catalogMock = jest.mocked(getMediaWikiCatalog);

function request(params: Record<string, string>) {
  return handleMediaWikiGet(
    new Request(`https://www.tjwiki.com/api.php?${new URLSearchParams(params)}`)
  );
}

beforeEach(() => {
  catalogMock.mockReset().mockResolvedValue(catalog);
  getProfileMock.mockReset().mockImplementation(async (nickname) => ({ ...profile, nickname }));
});

describe('AkariBot user queries', () => {
  it('serves the bot user and group-message requests without loading the catalog', async () => {
    catalogMock.mockRejectedValue(new Error('catalog unavailable'));
    const response = await request({
      action: 'query',
      format: 'json',
      list: 'users',
      ususers: profile.nickname,
      usprop: 'groups|blockinfo|registration|editcount|gender',
    });

    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: {
        users: [
          {
            name: profile.nickname,
            groups: profile.groups,
            registration: profile.registeredAt,
            editcount: 5,
            gender: 'unknown',
          },
        ],
      },
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');

    const messages = await request({ action: 'query', meta: 'allmessages', amprefix: 'group-' });
    expect(await messages.json()).toEqual({ batchcomplete: true, query: { allmessages: [] } });
    expect(catalogMock).not.toHaveBeenCalled();
    expect(getProfileMock).toHaveBeenCalledTimes(1);
  });

  it('projects only allowed fields even if the reader returns extra account or block data', async () => {
    getProfileMock.mockResolvedValue({
      ...profile,
      email: 'private@example.test',
      username_hash: 'private-hash',
      blockedby: 'moderator',
      blockreason: 'private reason',
    } as PublicUserProfile);

    const response = await request({
      action: 'query',
      list: 'users',
      ususers: profile.nickname,
      usprop: 'blockinfo',
    });
    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: { users: [{ name: profile.nickname }] },
    });
  });

  it.each([undefined, ''])('returns only names when usprop is %s', async (usprop) => {
    const response = await request({
      action: 'query',
      list: 'users',
      ususers: profile.nickname,
      ...(usprop === undefined ? {} : { usprop }),
    });
    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: { users: [{ name: profile.nickname }] },
    });
  });

  it('returns zero counts and empty group membership accurately', async () => {
    getProfileMock.mockResolvedValue({
      ...profile,
      groups: [],
      contributionTotals: { articles: 0, gameData: 0, all: 0 },
    });
    const response = await request({
      action: 'query',
      list: 'users',
      ususers: profile.nickname,
      usprop: 'editcount|groups',
    });
    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: { users: [{ name: profile.nickname, editcount: 0, groups: [] }] },
    });
  });

  it('preserves exact nicknames and request order across existing and missing users', async () => {
    const names = ['Mixed_Case', 'Mixed Case', '  间隔  用户  ', '不存在'];
    getProfileMock.mockImplementation(async (nickname) =>
      nickname === '不存在' ? null : { ...profile, nickname }
    );
    const response = await request({ action: 'query', list: 'users', ususers: names.join('|') });

    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: {
        users: names.map((name) => (name === '不存在' ? { name, missing: true } : { name })),
      },
    });
    expect(getProfileMock.mock.calls.map(([name]) => name)).toEqual(names);
  });

  it('returns missing users when the public profile reader is unavailable', async () => {
    getProfileMock.mockResolvedValue(null);
    const response = await request({ action: 'query', list: 'users', ususers: '用户' });
    expect(await response.json()).toEqual({
      batchcomplete: true,
      query: { users: [{ name: '用户', missing: true }] },
    });
  });

  it('accepts 15 nicknames of up to 500 characters', async () => {
    const names = Array.from({ length: 15 }, (_, index) => `${index}`.padEnd(500, '名'));
    const response = await request({ action: 'query', list: 'users', ususers: names.join('|') });
    expect((await response.json()).query.users).toHaveLength(15);
    expect(getProfileMock).toHaveBeenCalledTimes(15);
  });

  it.each([
    [{}, 'missingparam'],
    [{ ususers: '' }, 'invalidparam'],
    [{ ususers: '   ' }, 'invalidparam'],
    [{ ususers: 'name||other' }, 'invalidparam'],
    [{ ususers: Array.from({ length: 16 }, () => 'name').join('|') }, 'toomanyvalues'],
    [{ ususers: '名'.repeat(501) }, 'invalidtitle'],
    [{ ususers: 'name', usprop: 'groups|email' }, 'unknown_prop'],
    [{ ususers: 'name', titles: '汤姆' }, 'invalidparammix'],
    [{ ususers: 'name', pageids: '1' }, 'invalidparammix'],
    [{ ususers: 'name', meta: 'siteinfo' }, 'invalidparammix'],
  ])('rejects invalid user parameters %j', async (params, code) => {
    const response = await request({ action: 'query', list: 'users', ...params });
    expect(await response.json()).toEqual({ error: { code, info: expect.any(String) } });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(getProfileMock).not.toHaveBeenCalled();
    expect(catalogMock).not.toHaveBeenCalled();
  });

  it.each([
    [{ amprefix: 'other-' }, 'invalidparam'],
    [{}, 'invalidparam'],
    [{ amprefix: 'group-', list: 'search' }, 'invalidparammix'],
    [{ amprefix: 'group-', titles: '汤姆' }, 'invalidparammix'],
  ])('rejects unsupported message parameters %j', async (params, code) => {
    const response = await request({ action: 'query', meta: 'allmessages', ...params });
    expect((await response.json()).error.code).toBe(code);
    expect(catalogMock).not.toHaveBeenCalled();
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it('returns a generic error when the profile backend fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getProfileMock.mockRejectedValue(new Error('private database details'));
    const response = await request({ action: 'query', list: 'users', ususers: 'name' });
    expect(await response.json()).toEqual({
      error: { code: 'internal_api_error', info: 'The MediaWiki API is temporarily unavailable.' },
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
    expect(catalogMock).not.toHaveBeenCalled();
  });
});

describe('existing MediaWiki modules', () => {
  it('advertises the User namespace while preserving article paths and other namespaces', async () => {
    const response = await request({ action: 'query', meta: 'siteinfo' });
    const body = await response.json();
    expect(body.query.general.articlepath).toBe('/$1');
    expect(body.query.namespaces).toEqual({
      '-1': { '*': 'Special', canonical: 'Special', id: -1, case: 'first-letter' },
      '0': { '*': '', id: 0, case: 'first-letter', content: '' },
      '2': { '*': 'User', canonical: 'User', id: 2, case: 'case-sensitive' },
    });
    expect(getProfileMock).not.toHaveBeenCalled();
  });

  it.each([{ titles: 'Tom' }, { pageids: '1' }])('preserves page lookup %j', async (params) => {
    jest.mocked(getMediaWikiPageById).mockReturnValue(page);
    const response = await request({ action: 'query', ...params });
    const body = await response.json();
    expect(body.query.pages['1']).toMatchObject({
      pageid: 1,
      title: page.title,
      extract: page.extract,
      canonicalurl: page.canonicalUrl,
    });
    if ('titles' in params) {
      expect(body.query.redirects).toEqual([{ from: 'Tom', to: page.title }]);
    }
  });

  it('preserves missing page responses', async () => {
    jest.mocked(lookupMediaWikiPage).mockReturnValue(undefined);
    const response = await request({ action: 'query', titles: '不存在' });
    expect((await response.json()).query.pages['-1']).toEqual({
      ns: 0,
      title: '不存在',
      missing: true,
    });
  });

  it('preserves search results', async () => {
    jest
      .mocked(searchMediaWikiCatalog)
      .mockReturnValue([
        { page, pageid: 1, title: page.title, snippet: '猫阵营', wordcount: 1, score: 10 },
      ]);
    const response = await request({ action: 'query', list: 'search', srsearch: '汤姆' });
    expect((await response.json()).query.search).toEqual([
      expect.objectContaining({ title: page.title, pageid: 1, snippet: '猫阵营' }),
    ]);
  });

  it('preserves parsed page text and sections', async () => {
    const response = await request({ action: 'parse', page: page.title, prop: 'text|sections' });
    expect((await response.json()).parse).toEqual({
      title: page.title,
      pageid: 1,
      sections: [],
      text: { '*': `<div class="mw-parser-output"><p>${page.extract}</p></div>` },
    });
  });

  it('preserves OPTIONS headers', () => {
    const response = handleMediaWikiOptions();
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(response.headers.get('Cache-Control')).toBe('no-store, max-age=0');
  });
});
