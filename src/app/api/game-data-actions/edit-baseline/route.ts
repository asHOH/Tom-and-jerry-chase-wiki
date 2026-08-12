import { NextResponse, type NextRequest } from 'next/server';

import { invalidatePublicGameDataActionsCache } from '@/lib/gameData/publicActionsCache';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
};

async function baselineResponse() {
  const snapshot = await getPublishedGameDataSnapshot();

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
  const origin = request.headers.get('origin');

  try {
    if (!origin || new URL(origin).origin !== origin || origin !== request.nextUrl.origin) {
      return errorResponse('请求来源无效', 403);
    }
  } catch {
    return errorResponse('请求来源无效', 403);
  }

  try {
    const rateLimit = await checkRateLimit(request, 'expensive', 'game-data-edit-baseline');
    if (!rateLimit.allowed) {
      return errorResponse('请求过于频繁，请稍后重试', 429, rateLimit.headers);
    }
  } catch (error) {
    // Upstash is an optional enhancement. Cache synchronization must remain
    // available when the limiter is unconfigured or temporarily unavailable.
    console.warn('Edit-baseline rate limit check failed open.', error);
  }

  try {
    invalidatePublicGameDataActionsCache();
    return await baselineResponse();
  } catch (error) {
    console.error('Failed to refresh the edit baseline.', error);
    return errorResponse('加载编辑数据失败', 500);
  }
}
