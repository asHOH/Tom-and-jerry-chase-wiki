import { headers } from 'next/headers';

const HOST_ENV_KEYS = [
  'APP_PUBLIC_HOST',
  'NEXT_PUBLIC_SITE_HOST',
  'SITE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_DOMAIN',
];

const sanitize = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined') {
    return undefined;
  }
  return trimmed;
};

export async function getDeploymentHostname(): Promise<string> {
  for (const key of HOST_ENV_KEYS) {
    const value = sanitize(process.env[key]);
    if (value) {
      return value;
    }
  }

  const headerList = await headers();
  const forwardedHost = sanitize(headerList.get('x-forwarded-host'));
  if (forwardedHost) {
    return forwardedHost;
  }

  const host = sanitize(headerList.get('host'));
  if (host) {
    return host;
  }

  return 'localhost';
}

const isLoopbackHost = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    /^[0-9.]+$/.test(normalized) ||
    normalized === '::1'
  );
};

export function getCookieDomain(hostname: string): string | undefined {
  const sanitizedHost = sanitize(hostname);
  if (!sanitizedHost) {
    return undefined;
  }

  const [hostWithoutPortRaw] = sanitizedHost.split(':');
  const hostWithoutPort = hostWithoutPortRaw ?? sanitizedHost;
  if (isLoopbackHost(hostWithoutPort)) {
    return undefined;
  }

  const parts = hostWithoutPort.split('.');
  if (parts.length <= 1) {
    return undefined;
  }

  if (parts.length === 2) {
    return `.${hostWithoutPort}`;
  }

  return `.${parts.slice(-2).join('.')}`;
}
