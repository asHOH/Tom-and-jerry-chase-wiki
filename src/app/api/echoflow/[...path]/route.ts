/**
 * EchoFlow API
 *
 */

import { NextRequest, NextResponse } from 'next/server';

import { cached } from '@/lib/serverCache';

import { resolvePath } from '../resolvers';

const MAX_URL_LENGTH = 2000;
const MAX_DETAIL_ID_LENGTH = 100;
const VALID_RESOURCE_TYPES = [
  'characters',
  'cards',
  'items',
  'entities',
  'buffs',
  'fixtures',
  'maps',
  'modes',
  'achievements',
  'specialSkills',
  'articles',
] as const;
type ValidResourceType = (typeof VALID_RESOURCE_TYPES)[number];

type RouteParams = {
  params: Promise<{ path: string[] }>;
};

function toJsonl(data: unknown): string {
  if (Array.isArray(data)) {
    return data.map((item) => JSON.stringify(item)).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => JSON.stringify({ [key]: value }))
      .join('\n');
  }

  return JSON.stringify(data);
}

function getCacheTtl(resourceType: string): number {
  if (resourceType === 'articles') {
    return 30;
  }
  return 300;
}

function decodePathSegments(segments: string[]): string[] {
  return segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

const API_KEY_HEADER = 'X-EchoFlow-Key';
const FLOW_KEY = process.env.FLOWKEY;

function buildTrustedHostnames(): string[] {
  const hostnames: string[] = [];
  if (process.env.NODE_ENV === 'development') {
    hostnames.push('localhost', '127.0.0.1');
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tjwiki.com';
  try {
    const hostname = new URL(siteUrl).hostname;
    hostnames.push(hostname);
    if (!hostname.startsWith('www.')) {
      hostnames.push(`www.${hostname}`);
    }
  } catch {
    hostnames.push('www.tjwiki.com', 'tjwiki.com');
  }
  return hostnames;
}

const TRUSTED_HOSTNAMES = buildTrustedHostnames();

function verifyClientKey(request: NextRequest): boolean {
  const clientKey = request.headers.get(API_KEY_HEADER);
  if (!clientKey || !FLOW_KEY) {
    return false;
  }
  return clientKey === FLOW_KEY;
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const originHostname = new URL(origin).hostname;
    return TRUSTED_HOSTNAMES.some(
      (trusted) => originHostname === trusted || originHostname.endsWith(`.${trusted}`)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: 'origin not allowed', code: 'ORIGIN_FORBIDDEN' },
      { status: 403 }
    );
  }

  if (request.url.length > MAX_URL_LENGTH) {
    return NextResponse.json(
      { error: 'URL too long', code: 'URL_TOO_LONG', max: MAX_URL_LENGTH },
      { status: 414 }
    );
  }

  if (!FLOW_KEY) {
    return NextResponse.json(
      { error: 'EchoFlow API is not enabled', code: 'SERVICE_DISABLED' },
      { status: 503 }
    );
  }

  if (!verifyClientKey(request)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { path: rawPathSegments } = await params;
  const pathSegments = decodePathSegments(rawPathSegments);

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ error: 'Not found', code: 'PATH_MISSING' }, { status: 404 });
  }

  const detailId =
    pathSegments.length > 1 ? sanitizeDetailId(pathSegments.slice(1).join('/')) : undefined;

  function sanitizeDetailId(id: string): string | undefined {
    if (!id || id.length === 0) return undefined;
    const decoded = id.replace(/%2f/gi, '/').replace(/\\/g, '/');
    if (decoded.includes('..') || decoded.includes('%')) {
      return undefined;
    }
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const char = decoded.charAt(i);
      if (charCode < 0x20 || '<>\'"\\'.includes(char)) {
        return undefined;
      }
    }
    return decoded.slice(0, MAX_DETAIL_ID_LENGTH);
  }

  const firstSegment = pathSegments[0];
  if (!firstSegment) {
    return NextResponse.json({ error: 'Not found', code: 'PATH_MISSING' }, { status: 404 });
  }

  const resourceType = firstSegment.toLowerCase();

  if (!VALID_RESOURCE_TYPES.includes(resourceType as ValidResourceType)) {
    return NextResponse.json(
      { error: 'Resource type not found', code: 'TYPE_NOT_FOUND', resourceType },
      { status: 404 }
    );
  }

  if (detailId !== undefined && sanitizeDetailId(detailId) === undefined) {
    return NextResponse.json(
      { error: 'Invalid detail ID', code: 'INVALID_DETAIL_ID' },
      { status: 400 }
    );
  }

  const format = request.nextUrl.searchParams.get('format') || 'json';
  const fullData = request.nextUrl.searchParams.get('fullData') === 'true';

  try {
    const result = await cached([resourceType, detailId, fullData], async () => {
      return resolvePath(resourceType, detailId, fullData);
    });

    if (!result) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const responseData =
      result && typeof result === 'object' && 'data' in result ? result : { data: result };

    const healthStatus = FLOW_KEY ? 'healthy' : 'disabled';

    if (format === 'jsonl') {
      const jsonlContent = toJsonl(responseData.data);
      return new NextResponse(jsonlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/jsonl',
          'X-EchoFlow-Health': healthStatus,
        },
      });
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, max-age=${getCacheTtl(resourceType)}, stale-while-revalidate=60`,
        'X-EchoFlow-Health': healthStatus,
        'Access-Control-Allow-Origin': origin || '',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('EchoFlow API error:', errorMessage);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const healthStatus = FLOW_KEY ? 'healthy' : 'disabled';

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-EchoFlow-Key',
      'Cache-Control': 'public, max-age=86400',
      'X-EchoFlow-Health': healthStatus,
    },
  });
}
