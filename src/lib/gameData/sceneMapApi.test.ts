/** @jest-environment node */
import { NextResponse } from 'next/server';

import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { checkRateLimit } from '@/lib/rateLimit';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { emptyAnnotations } from '@/features/maps/sceneAnnotations';
import { POST } from '@/app/api/maps/[mapId]/annotations/route';
import { GET as editGET } from '@/app/api/maps/[mapId]/edit-context/route';
import { OPTIONS, GET as publicGET } from '@/app/api/maps/[mapId]/route';

import { getPendingActionTargets } from './pendingActionAwarenessServer';
import { getFreshApprovedActionSnapshot } from './published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from './published/publishedSnapshot';
import { handleGameDataSubmission } from './submission';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermissionOrAnonymous: jest.fn() }));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/supabase/config', () => ({ hasSupabasePublicConfig: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ hasSupabaseAdminConfig: jest.fn() }));
jest.mock('./published/publishedSnapshot', () => ({ getPublishedDomainReadModel: jest.fn() }));
jest.mock('./published/getApprovedActionSnapshot', () => ({
  getFreshApprovedActionSnapshot: jest.fn(),
}));
jest.mock('./pendingActionAwarenessServer', () => ({ getPendingActionTargets: jest.fn() }));
jest.mock('./submission', () => ({ handleGameDataSubmission: jest.fn() }));
const ctx = { params: Promise.resolve({ mapId: 'classic-home-i' }) };
const key = '7d1de34f-8b75-4aa7-8d43-9138195bca94';
const annotations = {
  version: 1,
  points: [
    {
      id: key,
      category: 'scoutingCanary',
      anchor: { slot: 'woshi_room', variant: 'woshi2', position: { x: 1, y: 2 } },
      description: '',
      relatedEntries: [],
    },
  ],
};
function request(body?: unknown, origin = 'https://maps.tjwiki.com') {
  return new Request('https://www.tjwiki.com/api/maps/classic-home-i/annotations/', {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
beforeEach(() => {
  jest.mocked(checkRateLimit).mockResolvedValue({ allowed: true, headers: {} } as never);
  jest.mocked(hasSupabasePublicConfig).mockReturnValue(true);
  jest.mocked(hasSupabaseAdminConfig).mockReturnValue(true);
  jest.mocked(getPendingActionTargets).mockResolvedValue({ targets: [], truncated: false });
  jest.mocked(getPublishedDomainReadModel).mockResolvedValue({
    revision: 'v1:test',
    data: { 经典之家I: { name: '经典之家I' } },
  } as never);
  jest
    .mocked(getFreshApprovedActionSnapshot)
    .mockResolvedValue({ rows: [], actionRevision: 'v1:fresh' } as never);
  jest
    .mocked(requirePermissionOrAnonymous)
    .mockResolvedValue({ userId: null, grants: [], supabase: {} } as never);
  jest
    .mocked(handleGameDataSubmission)
    .mockResolvedValue(
      NextResponse.json({ result: [{ is_public: false, status: 'pending', id: key }] })
    );
});
it('serves only the published layer and supports the fresh edit baseline', async () => {
  const publicResponse = await publicGET(request(), ctx);
  expect(await publicResponse.json()).toMatchObject({
    annotations: emptyAnnotations(),
    hasAnnotations: false,
  });
  expect(getFreshApprovedActionSnapshot).not.toHaveBeenCalled();
  const response = await editGET(request(), ctx);
  expect(await response.json()).toMatchObject({ canSubmit: true, authenticated: false });
  expect(getFreshApprovedActionSnapshot).toHaveBeenCalledTimes(1);
  expect(requirePermissionOrAnonymous).toHaveBeenCalledWith(
    'game_data_action.create',
    [{ resourceType: 'maps', resourceId: '经典之家I' }],
    'all',
    expect.objectContaining({ blockAction: 'edit' })
  );
});
it('returns capability-disabled context when database features are disabled', async () => {
  jest.mocked(hasSupabasePublicConfig).mockReturnValue(false);
  expect(await (await editGET(request(), ctx)).json()).toMatchObject({ canSubmit: false });
  expect(requirePermissionOrAnonymous).not.toHaveBeenCalled();
});
it('preserves credentialed preflight and allows the idempotency header', () => {
  const response = OPTIONS(request());
  expect(response.status).toBe(204);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://maps.tjwiki.com');
  expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Idempotency-Key');
  expect(OPTIONS(request(undefined, 'https://evil.example')).status).toBe(403);
});
it('rejects unknown maps and untrusted mutation origins before invoking submission', async () => {
  expect(
    (await POST(request({ previous: null, annotations }, 'https://evil.example'), ctx)).status
  ).toBe(403);
  expect(
    (await publicGET(request(), { params: Promise.resolve({ mapId: 'unknown' }) })).status
  ).toBe(404);
  expect(handleGameDataSubmission).not.toHaveBeenCalled();
});
it('translates annotation mutations to ordinary map actions and preserves keys across retries', async () => {
  const body = { previous: null, annotations, message: 'annotation', submitMode: 'default' };
  for (let i = 0; i < 2; i++) expect((await POST(request(body), ctx)).status).toBe(200);
  for (const [translated, kind] of jest.mocked(handleGameDataSubmission).mock.calls) {
    expect(kind).toBe('ordinary');
    expect(translated.headers.get('Idempotency-Key')).toBe(key);
    expect(await translated.json()).toMatchObject({
      entityType: 'maps',
      entries: [{ op: 'add', path: '经典之家I.sceneAnnotations', newValue: annotations }],
    });
  }
});
it('preserves before-values, pending acknowledgements, and stale conflict responses', async () => {
  jest
    .mocked(handleGameDataSubmission)
    .mockResolvedValue(NextResponse.json({ error: 'stale_edit' }, { status: 409 }));
  const response = await POST(
    request({ previous: emptyAnnotations(), annotations, pendingAcknowledgementToken: 'v1:ack' }),
    ctx
  );
  expect(response.status).toBe(409);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  const [translated] = jest.mocked(handleGameDataSubmission).mock.calls[0]!;
  expect(await translated.json()).toMatchObject({
    entries: [{ op: 'set', oldValue: emptyAnnotations() }],
    pendingAcknowledgementToken: 'v1:ack',
  });
});
it('rejects malformed, excessive, and unchanged annotation submissions', async () => {
  for (const body of [
    { previous: null, annotations: emptyAnnotations() },
    {
      previous: null,
      annotations: { ...annotations, points: [...annotations.points, ...annotations.points] },
    },
    { previous: 'invalid', annotations },
  ])
    expect((await POST(request(body), ctx)).status).toBeGreaterThanOrEqual(400);
  expect(handleGameDataSubmission).not.toHaveBeenCalled();
});
it('honors permission failures and rate-limit responses', async () => {
  jest
    .mocked(requirePermissionOrAnonymous)
    .mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
  expect((await editGET(request(), ctx)).status).toBe(403);
  jest
    .mocked(checkRateLimit)
    .mockResolvedValue({ allowed: false, headers: { 'Retry-After': '10' } } as never);
  const response = await POST(request({ previous: null, annotations }), ctx);
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBe('10');
});

it('disables writes safely when privileged storage credentials are missing', async () => {
  jest.mocked(hasSupabaseAdminConfig).mockReturnValue(false);
  expect(await (await editGET(request(), ctx)).json()).toMatchObject({ canSubmit: false });
  expect(getFreshApprovedActionSnapshot).not.toHaveBeenCalled();
  expect((await POST(request({ previous: null, annotations }), ctx)).status).toBe(501);
  expect(handleGameDataSubmission).not.toHaveBeenCalled();
});
it('applies bounded body limits before submission', async () => {
  const req = request({ previous: null, annotations });
  req.headers.set('content-length', '2097152');
  expect((await POST(req, ctx)).status).toBe(413);
  expect(handleGameDataSubmission).not.toHaveBeenCalled();
});

it('rejects documents unchanged apart from JSON key ordering', async () => {
  const previous = {
    points: annotations.points.map((p) => ({
      description: p.description,
      category: p.category,
      relatedEntries: p.relatedEntries,
      anchor: {
        variant: p.anchor.variant,
        position: { y: p.anchor.position.y, x: p.anchor.position.x },
        slot: p.anchor.slot,
      },
      id: p.id,
    })),
    version: 1,
  };
  expect((await POST(request({ previous, annotations }), ctx)).status).toBe(422);
  expect(handleGameDataSubmission).not.toHaveBeenCalled();
});
