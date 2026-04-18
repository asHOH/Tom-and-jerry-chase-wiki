/**
 * EchoFlow API
 *
 */

import { NextRequest, NextResponse } from 'next/server';

import { cached } from '@/lib/serverCache';
import { env } from '@/env';

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
  'special-skills',
  'articles',
  'win-rates',
  'ranks',
  'recommended',
  'traits',
  'character-relations',
  'history',
  'wiki-history',
  'contributors',
  'factions',
  'itemgroups',
  'usages',
  'mechanics',
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
const FLOW_KEY = env.FLOWKEY;

function buildCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !isOriginAllowed(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
  };
}

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

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const originHostname = url.hostname;
    return TRUSTED_HOSTNAMES.some((trusted) => {
      if (originHostname === trusted) return true;
      if (originHostname.endsWith(`.${trusted}`)) {
        const subdomain = originHostname.slice(0, -(trusted.length + 1));
        return /^[a-zA-Z0-9]+$/.test(subdomain);
      }
      return false;
    });
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');
  const clientKey = request.headers.get(API_KEY_HEADER);
  const hasValidKey = FLOW_KEY && clientKey === FLOW_KEY;

  if (!FLOW_KEY) {
    return NextResponse.json(
      { error: 'EchoFlow API is not enabled', code: 'SERVICE_DISABLED' },
      { status: 503 }
    );
  }

  if (!hasValidKey) {
    if (!isOriginAllowed(origin)) {
      return NextResponse.json(
        { error: 'origin not allowed', code: 'ORIGIN_FORBIDDEN' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401, headers: buildCorsHeaders(origin) }
    );
  }

  if (request.url.length > MAX_URL_LENGTH) {
    return NextResponse.json(
      { error: 'URL too long', code: 'URL_TOO_LONG', max: MAX_URL_LENGTH },
      { status: 414, headers: buildCorsHeaders(origin) }
    );
  }

  const { path: rawPathSegments } = await params;
  const pathSegments = decodePathSegments(rawPathSegments);

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json(
      { error: 'Not found', code: 'PATH_MISSING' },
      { status: 404, headers: buildCorsHeaders(origin) }
    );
  }

  function sanitizeDetailId(id: string): string | undefined {
    if (!id || id.length === 0) return undefined;
    const decoded = id.replace(/%2f/gi, '/').replace(/\\/g, '/');
    if (decoded.includes('..')) {
      return undefined;
    }
    if (decoded.length > MAX_DETAIL_ID_LENGTH) {
      return undefined;
    }
    return decoded;
  }

  const detailId =
    pathSegments.length > 1 ? sanitizeDetailId(pathSegments.slice(1).join('/')) : undefined;

  const firstSegment = pathSegments[0];
  if (!firstSegment) {
    return NextResponse.json(
      { error: 'Not found', code: 'PATH_MISSING' },
      { status: 404, headers: buildCorsHeaders(origin) }
    );
  }

  const resourceType = firstSegment.toLowerCase();

  if (!VALID_RESOURCE_TYPES.includes(resourceType as ValidResourceType)) {
    return NextResponse.json(
      { error: 'Resource type not found', code: 'TYPE_NOT_FOUND', resourceType },
      { status: 404, headers: buildCorsHeaders(origin) }
    );
  }

  const format = request.nextUrl.searchParams.get('format') || 'json';
  const fullData = request.nextUrl.searchParams.get('fullData') === 'true';

  try {
    const result = await cached([resourceType, detailId, fullData], async () => {
      return resolvePath(resourceType, detailId, fullData);
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Not found', code: 'NOT_FOUND' },
        { status: 404, headers: buildCorsHeaders(origin) }
      );
    }

    const responseData =
      result && typeof result === 'object' && 'data' in result ? result : { data: result };

    const corsHeaders = buildCorsHeaders(origin);
    const securityHeaders = {
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    };

    if (format === 'jsonl') {
      const jsonlContent = toJsonl(responseData.data);
      return new NextResponse(jsonlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/jsonl',
          'Cache-Control': `public, max-age=${getCacheTtl(resourceType)}, stale-while-revalidate=60`,
          'X-EchoFlow-Health': 'healthy',
          ...corsHeaders,
          ...securityHeaders,
        },
      });
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, max-age=${getCacheTtl(resourceType)}, stale-while-revalidate=60`,
        'X-EchoFlow-Health': 'healthy',
        ...corsHeaders,
        ...securityHeaders,
      },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (isDev) {
      console.error('EchoFlow API error:', errorMessage);
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDev && { details: errorMessage }),
      },
      { status: 500, headers: buildCorsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const clientKey = request.headers.get(API_KEY_HEADER);
  const hasValidKey = FLOW_KEY && clientKey === FLOW_KEY;

  if (!isOriginAllowed(origin) && !hasValidKey) {
    return new NextResponse(null, { status: 403 });
  }

  const corsHeaders = buildCorsHeaders(origin);

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-EchoFlow-Key',
      'Cache-Control': 'public, max-age=86400',
      'X-EchoFlow-Health': 'healthy',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
