/**
 * EchoFlow API
 *
 */

import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TAGS } from '@/lib/cacheTags';
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

type ResponseMeta = {
  type: string;
  count?: number;
  path: string;
  hasDetail: boolean;
  format: 'json' | 'jsonl';
  timestamp: string;
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

function getCacheTags(resourceType: string): string[] {
  if (resourceType === 'articles') {
    return [CACHE_TAGS.articles];
  }
  return [];
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

const WORKER_URL = process.env.ECHOFLOW_WORKER_URL || 'https://tjwikiflowmcplic.zuyst.top';
const API_KEY_HEADER = 'X-EchoFlow-Key';

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

interface CachedKey {
  key: string;
  expiry?: number;
  verifiedAt: number;
  failedAttempts: number;
}

class KeyManager {
  private cache: CachedKey | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000;
  private readonly VERIFY_INTERVAL = 5 * 60 * 1000;
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly FAILED_ATTEMPTS_RESET = 60 * 1000;
  private verifiedClientKeys: Map<string, CachedKey> = new Map();
  private lastError: { message: string; time: number } | null = null;
  private circuitBreakerOpen = false;
  private circuitBreakerResetTime = 0;

  private getDomain(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'localhost';
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tjwiki.com';
    try {
      return new URL(siteUrl).hostname;
    } catch {
      return 'www.tjwiki.com';
    }
  }

  private getSupabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  }

  private getOrigin(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tjwiki.com';
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) return false;
    if (Date.now() > this.circuitBreakerResetTime) {
      this.circuitBreakerOpen = false;
      this.lastError = null;
      return false;
    }
    return true;
  }

  private tripCircuitBreaker(): void {
    this.circuitBreakerOpen = true;
    this.circuitBreakerResetTime = Date.now() + 30 * 1000;
  }

  async getKey(): Promise<string | null> {
    if (this.cache && this.cache.expiry !== undefined && this.cache.expiry > Date.now()) {
      return this.cache.key;
    }

    if (this.isCircuitBreakerOpen()) {
      return this.cache?.key || null;
    }

    try {
      const response = await fetch(`${WORKER_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: this.getOrigin(),
        },
        body: JSON.stringify({
          domain: this.getDomain(),
          supabase_url: this.getSupabaseUrl(),
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 429) {
        console.warn('EchoFlow: Rate limited when registering key');
        return this.cache?.key || null;
      }

      if (!response.ok) {
        console.error('EchoFlow: Failed to register key:', response.status);
        this.lastError = { message: `HTTP ${response.status}`, time: Date.now() };
        return this.cache?.key || null;
      }

      const data = await response.json();

      if (data.ok && data.key) {
        this.cache = {
          key: data.key,
          expiry: Date.now() + this.CACHE_TTL,
          verifiedAt: Date.now(),
          failedAttempts: 0,
        };
        return this.cache.key;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('EchoFlow: Key registration error:', errorMessage);
      this.lastError = { message: errorMessage, time: Date.now() };
      this.tripCircuitBreaker();
      return this.cache?.key ?? null;
    }
  }

  async rotateKey(): Promise<string | null> {
    if (this.isCircuitBreakerOpen()) {
      return this.cache?.key || null;
    }

    try {
      const response = await fetch(`${WORKER_URL}/auth/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: this.getOrigin(),
        },
        body: JSON.stringify({
          domain: this.getDomain(),
          supabase_url: this.getSupabaseUrl(),
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 429) {
        console.warn('EchoFlow: Rate limited when rotating key');
        return null;
      }

      if (!response.ok) {
        console.error('EchoFlow: Failed to rotate key:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.ok && data.key) {
        this.cache = {
          key: data.key,
          expiry: Date.now() + this.CACHE_TTL,
          verifiedAt: Date.now(),
          failedAttempts: 0,
        };
        return this.cache.key;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('EchoFlow: Key rotation error:', errorMessage);
      this.tripCircuitBreaker();
      return null;
    }
  }

  async verifyKey(apiKey: string): Promise<boolean> {
    const cachedClient = this.verifiedClientKeys.get(apiKey);
    if (cachedClient) {
      if (cachedClient.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        if (Date.now() - cachedClient.verifiedAt < this.FAILED_ATTEMPTS_RESET) {
          return false;
        }
        cachedClient.failedAttempts = 0;
      }
      if (Date.now() - cachedClient.verifiedAt < this.VERIFY_INTERVAL) {
        return true;
      }
    }

    if (this.isCircuitBreakerOpen()) {
      if (cachedClient && cachedClient.failedAttempts < this.MAX_FAILED_ATTEMPTS) {
        return true;
      }
      return false;
    }

    try {
      const response = await fetch(`${WORKER_URL}/auth/verify/${encodeURIComponent(apiKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Origin: this.getOrigin(),
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 429) {
        if (cachedClient && cachedClient.failedAttempts < this.MAX_FAILED_ATTEMPTS) {
          return true;
        }
        return false;
      }

      const data = await response.json();

      if (data.ok === true) {
        this.verifiedClientKeys.set(apiKey, {
          key: apiKey,
          verifiedAt: Date.now(),
          failedAttempts: 0,
        });
        return true;
      }

      if (data.ok === false) {
        const newKey = await this.rotateKey();
        if (newKey) {
          console.log('EchoFlow: Key rotated successfully');
          this.verifiedClientKeys.set(apiKey, {
            key: apiKey,
            verifiedAt: Date.now(),
            failedAttempts: 0,
          });
          return true;
        }
      }

      if (cachedClient) {
        cachedClient.failedAttempts++;
        cachedClient.verifiedAt = Date.now();
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('EchoFlow: Key verification error:', errorMessage);
      this.tripCircuitBreaker();
      if (cachedClient && cachedClient.failedAttempts < this.MAX_FAILED_ATTEMPTS) {
        return true;
      }
      return false;
    }
  }

  getLastError(): { message: string; time: number } | null {
    return this.lastError;
  }

  isHealthy(): boolean {
    return !this.circuitBreakerOpen;
  }
}

const keyManager = new KeyManager();

async function getValidApiKey(): Promise<string | null> {
  return keyManager.getKey();
}

async function verifyClientKey(request: NextRequest): Promise<boolean> {
  const clientKey = request.headers.get(API_KEY_HEADER);
  if (!clientKey) {
    return false;
  }
  return keyManager.verifyKey(clientKey);
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

  const apiKey = await getValidApiKey();
  if (!apiKey) {
    const lastError = keyManager.getLastError();
    const isDegraded = !keyManager.isHealthy();
    return NextResponse.json(
      {
        error: 'Key management unavailable',
        code: 'KEY_UNAVAILABLE',
        ...(isDegraded && { degraded: true }),
        ...(lastError &&
          process.env.NODE_ENV === 'development' && {
            details: lastError.message,
          }),
      },
      { status: 503 }
    );
  }

  if (!(await verifyClientKey(request))) {
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

  const resourceType = pathSegments[0];
  if (!resourceType || !isValidResourceType(resourceType)) {
    return NextResponse.json(
      { error: 'Not found', code: 'RESOURCE_TYPE_INVALID' },
      { status: 404 }
    );
  }

  function isValidResourceType(type: string): type is ValidResourceType {
    return VALID_RESOURCE_TYPES.includes(type as ValidResourceType);
  }

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get('format');
  const format = formatParam === 'jsonl' || formatParam === 'json' ? formatParam : 'json';

  try {
    const sanitizedDetailId = detailId ? detailId.slice(0, MAX_DETAIL_ID_LENGTH) : undefined;
    const result = await cached(
      ['echoflow', resourceType, sanitizedDetailId ?? 'full', format],
      async () => {
        const resolved = await resolvePath(resourceType, sanitizedDetailId, !sanitizedDetailId);
        return resolved;
      },
      {
        revalidate: getCacheTtl(resourceType),
        tags: getCacheTags(resourceType),
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Not found', code: 'RESOURCE_NOT_FOUND', resourceType },
        { status: 404 }
      );
    }

    const responseMeta: ResponseMeta = {
      type: result.meta.type,
      ...(result.meta.count !== undefined && { count: result.meta.count }),
      path: `/api/echoflow/${pathSegments.join('/')}`,
      hasDetail: 'hasDetail' in result.meta ? result.meta.hasDetail : false,
      format,
      timestamp: new Date().toISOString(),
      ...('updatedAt' in result.meta && {
        updatedAt: (result.meta as { updatedAt: string }).updatedAt,
      }),
    };

    const healthStatus = keyManager.isHealthy() ? 'healthy' : 'degraded';

    if (format === 'jsonl') {
      const jsonlContent = toJsonl(result.data);
      return new NextResponse(jsonlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/jsonl',
          'Cache-Control': `public, max-age=${getCacheTtl(resourceType)}, stale-while-revalidate=60`,
          'X-EchoFlow-Type': result.meta.type,
          'X-EchoFlow-Count': String(result.meta.count ?? 1),
          'X-EchoFlow-Health': healthStatus,
          'Access-Control-Allow-Origin': origin || '',
        },
      });
    }

    return NextResponse.json(
      {
        data: result.data,
        meta: responseMeta,
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${getCacheTtl(resourceType)}, stale-while-revalidate=60`,
          'X-EchoFlow-Health': healthStatus,
          'Access-Control-Allow-Origin': origin || '',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode =
      error instanceof Error && 'code' in error
        ? (error as { code: string }).code
        : 'INTERNAL_ERROR';
    console.error('EchoFlow API error:', { message: errorMessage, code: errorCode });
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
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  const healthStatus = keyManager.isHealthy() ? 'healthy' : 'degraded';

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
