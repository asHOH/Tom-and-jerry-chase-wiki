import { NextResponse, type NextRequest } from 'next/server';

import { logPublicGameDataRouteMetric } from '@/lib/gameData/publicRouteMetrics';
import { getFreshApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { checkRateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/constants/seo';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
};
const PUBLIC_SITE_ORIGIN = new URL(SITE_URL).origin;

async function baselineResponse(
  approvedSnapshot?: Awaited<ReturnType<typeof getFreshApprovedActionSnapshot>>
) {
  const snapshot = await getPublishedGameDataSnapshot(approvedSnapshot);

  return NextResponse.json(
    {
      revision: snapshot.revision,
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

    try {
      const freshSnapshot = await getFreshApprovedActionSnapshot();
      const response = await baselineResponse(freshSnapshot);
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
