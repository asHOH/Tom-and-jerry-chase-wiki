import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';
import { getFreshApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import type { PublishedDomainRevision } from '@/lib/gameData/published/types';
import { PublishPreparationError, readBoundedJsonBody } from '@/lib/gameData/publishPreparation';
import { checkRateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/constants/seo';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
};
const PUBLIC_SITE_ORIGIN = new URL(SITE_URL).origin;
const recoverySchema = z
  .object({
    visibleRevisions: z
      .array(
        z
          .object({
            entityType: z.enum(PUBLISHABLE_ENTITY_TYPES),
            revision: z.string().regex(/^v1:[a-f0-9]{64}$/),
          })
          .strict()
      )
      .min(1)
      .max(PUBLISHABLE_ENTITY_TYPES.length * 2),
  })
  .strict();

async function baselineResponse(
  approvedSnapshot?: Awaited<ReturnType<typeof getFreshApprovedActionSnapshot>>,
  visibleRevisions: readonly PublishedDomainRevision[] = []
) {
  const snapshot = await getPublishedGameDataSnapshot(approvedSnapshot);
  const mismatchedDomains = [
    ...new Set(
      visibleRevisions
        .filter(({ entityType, revision }) => revision !== snapshot.domainRevisions[entityType])
        .map(({ entityType }) => entityType)
    ),
  ];
  if (mismatchedDomains.length > 0) {
    invalidatePublicGameDataActionsCache(mismatchedDomains);
    console.info('Edit-baseline cache recovery.', { domains: mismatchedDomains });
  }

  return NextResponse.json(
    {
      revision: snapshot.revision,
      domainRevisions: snapshot.domainRevisions,
      data: snapshot.data,
    },
    {
      headers: NO_STORE_HEADERS,
    }
  );
}

function errorResponse(error: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: { ...NO_STORE_HEADERS, ...headers },
    }
  );
}

export async function GET() {
  return baselineResponse();
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  let status = 500;

  try {
    const origin = request.headers.get('origin');

    try {
      if (
        !origin ||
        new URL(origin).origin !== origin ||
        (origin !== PUBLIC_SITE_ORIGIN && origin !== request.nextUrl.origin)
      ) {
        status = 403;
        return errorResponse('请求来源无效', status);
      }
    } catch {
      status = 403;
      return errorResponse('请求来源无效', status);
    }

    try {
      const rateLimit = await checkRateLimit(request, 'expensive', 'game-data-edit-baseline');
      if (!rateLimit.allowed) {
        status = 429;
        return errorResponse('请求过于频繁，请稍后重试', status, rateLimit.headers);
      }
    } catch (error) {
      // Upstash is an optional enhancement. Cache synchronization must remain
      // available when the limiter is unconfigured or temporarily unavailable.
      console.warn('Edit-baseline rate limit check failed open.', error);
    }

    let visibleRevisions: readonly PublishedDomainRevision[] = [];
    // Next's Node adapter can expose an empty ordinary POST as a body stream.
    const contentType = request.headers.get('content-type');
    if (contentType) {
      if (contentType.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
        status = 415;
        return errorResponse('编辑数据版本请求必须使用 JSON', status);
      }
      try {
        const parsed = recoverySchema.safeParse(await readBoundedJsonBody(request));
        if (!parsed.success) {
          status = 400;
          return errorResponse('编辑数据版本参数无效', status);
        }
        visibleRevisions = parsed.data.visibleRevisions as PublishedDomainRevision[];
      } catch (error) {
        status =
          error instanceof PublishPreparationError && error.detail.code === 'request_too_large'
            ? 413
            : 400;
        return errorResponse('编辑数据版本参数无效', status);
      }
    }

    try {
      const freshSnapshot = await getFreshApprovedActionSnapshot();
      const response = await baselineResponse(freshSnapshot, visibleRevisions);
      status = response.status;
      return response;
    } catch (error) {
      console.error('Failed to refresh the edit baseline.', error);
      status = 500;
      return errorResponse('加载编辑数据失败', status);
    }
  } finally {
    logPublicGameDataRouteMetric({
      route: '/api/game-data-actions/edit-baseline',
      method: 'POST',
      status,
      startedAt,
      requestCategory: 'edit-baseline-refresh',
    });
  }
}
