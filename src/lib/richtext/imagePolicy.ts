const DEFAULT_BUCKET = 'article-media';

const envBucket =
  process.env.SUPABASE_RTE_IMAGE_BUCKET ??
  process.env.NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET ??
  DEFAULT_BUCKET;

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const normalizedSupabaseUrl = rawSupabaseUrl.replace(/\/$/, '');

export const RTE_IMAGE_BUCKET = envBucket;

export const RTE_IMAGE_PUBLIC_BASE = normalizedSupabaseUrl
  ? `${normalizedSupabaseUrl}/storage/v1/object/public/${RTE_IMAGE_BUCKET}`
  : '';

export const RTE_IMAGE_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
];

export const RTE_IMAGE_MAX_BYTES = 3 * 1024 * 1024; // 3 MiB limit per upload

const INLINE_EVENT_HANDLER_REGEX = /\s+on[a-z]+\s*=\s*(['"]).*?\1/gi;
const IMG_TAG_REGEX = /<img\b[^>]*>/gi;
const SRC_ATTRIBUTE_REGEX = /src\s*=\s*(['"])(.*?)\1/i;

const DISALLOWED_SCHEMES = ['javascript:', 'data:'];

const RELATIVE_SRC_REGEX = /^\/(?!\/)/;

export function normalizeHostedImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const candidate = raw.trim();
  if (!candidate) return null;
  if (DISALLOWED_SCHEMES.some((scheme) => candidate.toLowerCase().startsWith(scheme))) {
    return null;
  }
  if (candidate.startsWith('//')) {
    return null;
  }
  if (RELATIVE_SRC_REGEX.test(candidate)) {
    return candidate;
  }
  if (!RTE_IMAGE_PUBLIC_BASE) {
    return null;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:') {
      return null;
    }
    if (candidate.startsWith(RTE_IMAGE_PUBLIC_BASE)) {
      return candidate;
    }
  } catch (error) {
    void error;
    return null;
  }
  return null;
}

function sanitizeImageTag(tag: string, srcMatch: RegExpMatchArray, normalizedSrc: string): string {
  const [fullMatch, , originalSrc] = srcMatch;
  let sanitizedTag = tag.replace(INLINE_EVENT_HANDLER_REGEX, '');
  if (normalizedSrc !== originalSrc) {
    sanitizedTag = sanitizedTag.replace(fullMatch, `src="${normalizedSrc}"`);
  }
  return sanitizedTag;
}

export function stripDisallowedImages(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(IMG_TAG_REGEX, (tag) => {
    const srcMatch = tag.match(SRC_ATTRIBUTE_REGEX);
    if (!srcMatch) {
      return '';
    }
    const normalizedSrc = normalizeHostedImageUrl(srcMatch[2]);
    if (!normalizedSrc) {
      return '';
    }
    return sanitizeImageTag(tag, srcMatch, normalizedSrc);
  });
}

export function describeAllowedImageSources(): string {
  if (RTE_IMAGE_PUBLIC_BASE) {
    return `站内路径（以 / 开头）或 ${RTE_IMAGE_PUBLIC_BASE} 下的地址`;
  }
  return '站内路径（以 / 开头）';
}
