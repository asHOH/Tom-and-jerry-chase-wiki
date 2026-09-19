/** @jest-environment node */

import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { invalidateCache } from '@/lib/cacheTags';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';

import { PATCH, PUT } from './[groupId]/route';
import { POST } from './route';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/supabase/adminClient', () => ({ requireSupabaseAdminClient: jest.fn() }));
jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: { users: 'users' },
  invalidateCache: jest.fn(),
}));
jest.mock('@/lib/auth/permissionResources', () => ({
  getAllStaticPermissionResourceOptions: jest.fn(),
  isKnownStaticPermissionResource: (type: string, id: string) =>
    type === 'characters' ? id === 'Tom' : null,
}));

const rpc = jest.fn();
const maybeSingle = jest.fn();
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));
const grant = {
  permission: 'article.update_any',
  scope: 'resource',
  resourceType: 'articles',
  resourceId: 'article-1',
};
const body = { name: 'Editors', description: '', isDefault: false, grants: [grant] };
const context = { params: Promise.resolve({ groupId: 'group-1' }) };
const request = (method: string, value: unknown) =>
  new Request('https://example.com/api/admin/groups/group-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });

beforeEach(() => {
  rpc.mockResolvedValue({ data: 'group-1', error: null });
  maybeSingle.mockResolvedValue({ data: { id: 'article-1' }, error: null });
  jest.mocked(requirePermission).mockResolvedValue({ supabase: { rpc } } as never);
  jest.mocked(requireSupabaseAdminClient).mockReturnValue({ from } as never);
});

describe.each([
  ['POST', POST, 'create_permission_group', 201],
  ['PATCH', PATCH, 'save_permission_group', 200],
  ['PUT', PUT, 'set_group_grants', 200],
] as const)('%s permission grants', (method, handler, rpcName, successStatus) => {
  it('checks authorization before parsing or looking up resources', async () => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    jest.mocked(requirePermission).mockResolvedValue({ error: denied });
    const req = request(method, body);
    const parse = jest.spyOn(req, 'json');

    expect(await handler(req, context)).toBe(denied);
    expect(requirePermission).toHaveBeenCalledWith('group.manage', undefined, 'all', {
      request: req,
      blockAction: 'edit',
    });
    expect(parse).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    { permission: 'unknown' },
    { permission: 'group.manage' },
    { resourceType: 'characters' },
    { resourceType: 'unknown' },
    { resourceType: ' ' },
    { resourceId: null },
    { scope: 'unknown' },
  ])('rejects invalid grant fields %j before resource lookups', async (override) => {
    const response = await handler(
      request(method, { ...body, grants: [{ ...grant, ...override }] }),
      context
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request body' });
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(['articles', 'characters'])('rejects an unknown %s resource', async (resourceType) => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await handler(
      request(method, {
        ...body,
        grants: [
          {
            ...grant,
            permission: resourceType === 'characters' ? 'relation.update' : grant.permission,
            resourceType,
            resourceId: 'missing',
          },
        ],
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Unknown resource ID' });
    expect(rpc).not.toHaveBeenCalled();
    expect(invalidateCache).not.toHaveBeenCalled();
  });

  it('passes valid global, type, static and database grants to the existing RPC', async () => {
    const grants = [
      { permission: 'group.manage', scope: 'global', resourceType: null, resourceId: null },
      { ...grant, scope: 'resource_type', resourceId: null },
      { ...grant, permission: 'relation.update', resourceType: 'characters', resourceId: 'Tom' },
      grant,
      { ...grant, permission: 'comment.moderate', resourceType: 'comments/articles' },
      { ...grant, permission: 'category.update', resourceType: 'categories' },
    ];
    const response = await handler(request(method, { ...body, grants }), context);

    expect(response.status).toBe(successStatus);
    expect(rpc).toHaveBeenCalledWith(rpcName, expect.objectContaining({ p_grants: grants }));
    expect(from.mock.calls).toEqual([['articles'], ['articles'], ['categories']]);
    expect(eq).toHaveBeenCalledWith('id', 'article-1');
    expect(invalidateCache).toHaveBeenCalledWith('users', 'background');
  });
});

it('defaults omitted grants on creation but requires them for updates', async () => {
  const created = await POST(request('POST', { name: 'Editors' }));
  expect(created.status).toBe(201);
  expect(rpc).toHaveBeenCalledWith('create_permission_group', {
    p_name: 'Editors',
    p_description: '',
    p_is_default: false,
    p_grants: [],
  });
  rpc.mockClear();

  const patch = await PATCH(
    request('PATCH', { name: 'Editors', description: '', isDefault: false }),
    context
  );
  const put = await PUT(request('PUT', {}), context);
  expect(patch.status).toBe(400);
  expect(put.status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});
