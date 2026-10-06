import 'server-only';

import { NextResponse } from 'next/server';

import { canAccessAll } from '@/lib/auth/permissions';
import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { checkRateLimit } from '@/lib/rateLimit';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import {
  annotationsEqual,
  emptyAnnotations,
  isSceneAnnotations,
} from '@/features/maps/sceneAnnotations';
import { getSceneMapName } from '@/features/maps/sceneMapLinks';

import { getPendingActionTargets } from './pendingActionAwarenessServer';
import { getFreshApprovedActionSnapshot } from './published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from './published/publishedSnapshot';
import { PublishPreparationError, readBoundedJsonBody } from './publishPreparation';
import { publishPreparationErrorResponse } from './publishPreparationResponse';
import { handleGameDataSubmission } from './submission';
import { resolveGameDataAdvancedSubmit } from './submitMode';

export type SceneMapRouteContext = { params: Promise<{ mapId: string }> };
export function sceneMapOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  if (/^https:\/\/(?:maps|www|dev)\.tjwiki\.com$/.test(origin)) return true;
  return (
    process.env.NODE_ENV !== 'production' &&
    /^http:\/\/(?:localhost|127\.0\.0\.1):(?:3000|5173|5175)$/.test(origin)
  );
}
export function sceneMapResponse(request: Request, response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Origin');
  const origin = request.headers.get('origin');
  if (origin && sceneMapOriginAllowed(request)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
  return response;
}
export function sceneMapOptions(request: Request): NextResponse {
  return sceneMapResponse(
    request,
    new NextResponse(null, { status: sceneMapOriginAllowed(request) ? 204 : 403 })
  );
}
const failure = (request: Request, error: string, status: number) =>
  sceneMapResponse(request, NextResponse.json({ error }, { status }));
async function mapBaseline(mapId: string, fresh: boolean) {
  const name = getSceneMapName(mapId);
  if (!name) return undefined;
  const domain = await getPublishedDomainReadModel(
    'maps',
    fresh ? await getFreshApprovedActionSnapshot() : undefined
  );
  const map = domain.data[name];
  if (!map) return undefined;
  const annotations = map.sceneAnnotations;
  if (annotations !== undefined && !isSceneAnnotations(annotations))
    throw new Error('Invalid published scene annotations');
  return {
    mapId,
    name,
    revision: domain.revision,
    annotations: annotations ?? emptyAnnotations(),
    hasAnnotations: annotations !== undefined,
  };
}
async function limit(request: Request) {
  try {
    const result = await checkRateLimit(request, 'expensive', 'scene-map-edit');
    if (!result.allowed)
      return sceneMapResponse(
        request,
        NextResponse.json(
          { error: '请求过于频繁，请稍后重试' },
          { status: 429, headers: result.headers }
        )
      );
  } catch (error) {
    console.warn('Scene-map optional rate limiter unavailable.', error);
  }
  return undefined;
}
export async function readSceneMap(
  request: Request,
  context: SceneMapRouteContext,
  edit = false
): Promise<NextResponse> {
  if (!sceneMapOriginAllowed(request)) return failure(request, '请求来源无效', 403);
  const { mapId } = await context.params;
  if (!getSceneMapName(mapId)) return failure(request, '地图不存在', 404);
  try {
    if (edit) {
      const denied = await limit(request);
      if (denied) return denied;
    }
    const writable = hasSupabasePublicConfig() && hasSupabaseAdminConfig();
    const baseline = await mapBaseline(mapId, edit && writable);
    if (!baseline) return failure(request, '地图不存在', 404);
    if (!edit) return sceneMapResponse(request, NextResponse.json(baseline));
    if (!writable)
      return sceneMapResponse(
        request,
        NextResponse.json({
          ...baseline,
          canSubmit: false,
          authenticated: false,
          pending: { targets: [], truncated: false },
          advancedSubmit: { available: false, defaultOutcome: 'pending', modes: ['default'] },
        })
      );
    const action = {
      op: baseline.hasAnnotations ? 'set' : 'add',
      path: `${baseline.name}.sceneAnnotations`,
      newValue: baseline.annotations,
    };
    const contexts = [{ resourceType: 'maps', resourceId: baseline.name }];
    const guard = await requirePermissionOrAnonymous('game_data_action.create', contexts, 'all', {
      request,
      blockAction: 'edit',
    });
    if ('error' in guard) return sceneMapResponse(request, guard.error);
    let pending = { targets: [], truncated: false } as Awaited<
      ReturnType<typeof getPendingActionTargets>
    >;
    if (hasSupabaseAdminConfig()) {
      try {
        pending = await getPendingActionTargets({
          entityType: 'maps',
          entityKey: baseline.name,
          userId: guard.userId,
        });
      } catch (error) {
        console.warn('Scene-map pending awareness unavailable.', error);
      }
    }
    const advancedSubmit = resolveGameDataAdvancedSubmit({
      entityType: 'maps',
      entries: [action],
      canAll: (permission, resources) => canAccessAll(guard.grants, permission, resources),
    });
    return sceneMapResponse(
      request,
      NextResponse.json({
        ...baseline,
        canSubmit: true,
        authenticated: guard.userId !== null,
        pending,
        advancedSubmit,
      })
    );
  } catch (error) {
    console.error('Failed to load scene annotations.', error);
    return failure(request, '加载地图标注失败', 500);
  }
}
export async function submitSceneMap(
  request: Request,
  context: SceneMapRouteContext
): Promise<NextResponse> {
  if (!request.headers.get('origin') || !sceneMapOriginAllowed(request))
    return failure(request, '请求来源无效', 403);
  const { mapId } = await context.params;
  const name = getSceneMapName(mapId);
  if (!name) return failure(request, '地图不存在', 404);
  if (!hasSupabasePublicConfig() || !hasSupabaseAdminConfig())
    return failure(request, '地图标注提交服务未启用', 501);
  const denied = await limit(request);
  if (denied) return denied;
  try {
    const body = await readBoundedJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return failure(request, '标注格式无效', 400);
    const input = body as Record<string, unknown>;
    if (
      !isSceneAnnotations(input.annotations) ||
      (input.previous !== null && !isSceneAnnotations(input.previous))
    )
      return failure(request, '标注格式无效', 400);
    if (annotationsEqual(input.previous ?? emptyAnnotations(), input.annotations))
      return failure(request, '标注没有实际变化', 422);
    const entry =
      input.previous === null
        ? { op: 'add', path: `${name}.sceneAnnotations`, newValue: input.annotations }
        : {
            op: 'set',
            path: `${name}.sceneAnnotations`,
            oldValue: input.previous,
            newValue: input.annotations,
          };
    const headers = new Headers(request.headers);
    headers.delete('content-length');
    const translated = new Request(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        entityType: 'maps',
        entries: [entry],
        message: input.message,
        submitMode: input.submitMode,
        pendingAcknowledgementToken: input.pendingAcknowledgementToken,
      }),
    });
    return sceneMapResponse(request, await handleGameDataSubmission(translated, 'ordinary'));
  } catch (error) {
    if (error instanceof PublishPreparationError)
      return sceneMapResponse(request, publishPreparationErrorResponse(error));
    console.error('Failed to submit scene annotations.', error);
    return failure(request, '提交标注失败', 500);
  }
}
