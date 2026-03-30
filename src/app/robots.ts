import { MetadataRoute } from 'next';

import { SITE_URL } from '@/constants/seo';

const IS_VERCEL = process.env.VERCEL === '1';
const IS_VERCEL_PREVIEW = IS_VERCEL && process.env.VERCEL_ENV !== 'production';

export default function robots(): MetadataRoute.Robots {
  if (IS_VERCEL_PREVIEW) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: undefined,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/articles/sitemap.xml`],
  };
}
