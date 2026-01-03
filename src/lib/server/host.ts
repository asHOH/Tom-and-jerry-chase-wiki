import { headers } from 'next/headers';

const HOST_ENV_KEYS = [
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
