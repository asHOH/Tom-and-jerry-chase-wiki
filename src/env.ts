import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const binaryFlag = z.enum(['0', '1']).optional();

export const env = createEnv({
  server: {
    SKIP_ENV_VALIDATION: z.enum(['0', '1']).optional(),

    // Feedback email (Resend)
    RESEND_API_KEY: z.string().optional(),
    FEEDBACK_EMAIL: z.email().optional(),
    RESEND_FROM_EMAIL: z.email().optional(),

    // Supabase
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    FLOWKEY: z.string().optional(),

    // Debug
    CHAT_DEBUG_LOG: binaryFlag,

    // Captcha
    CAPTCHA_SECRET_KEY: z.string().optional(),

    // Chat Service (Gemini)
    GEMINI_API_KEY: z.string().optional(),

    // Rate Limit (Upstash)
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Rich text editor
    SUPABASE_RTE_IMAGE_BUCKET: z.string().optional(),

    // Web Push
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),

    // Deployment metadata (optional)
    COMMIT_SHA: z.string().optional(),
    DEPLOY_COMMIT_SHA: z.string().optional(),
    NETLIFY_COMMIT_SHA: z.string().optional(),
    CF_PAGES_COMMIT_SHA: z.string().optional(),
    VERCEL_GIT_COMMIT_SHA: z.string().optional(),
    GITHUB_SHA: z.string().optional(),
    COMMIT_REF: z.string().optional(),

    DEPLOYMENT_ENVIRONMENT: z.string().optional(),
    DEPLOY_ENV: z.string().optional(),
    RUNTIME_ENVIRONMENT: z.string().optional(),

    VERCEL: z.string().optional(),
    VERCEL_ENV: z.string().optional(),

    CONTEXT: z.string().optional(),
    NETLIFY_CONTEXT: z.string().optional(),

    CF_PAGES: z.string().optional(),
    CF_PAGES_BRANCH: z.string().optional(),
    CF_PAGES_BASE_BRANCH: z.string().optional(),
  },

  client: {
    // Feature flags / toggles ("1" enabled, "0" disabled)
    NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL: binaryFlag,
    NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS: z.enum(['0', '1']).optional(),
    NEXT_PUBLIC_DISABLE_ARTICLES: binaryFlag,
    NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR: binaryFlag,
    NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION: binaryFlag,

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET: z.string().optional(),

    // Captcha
    NEXT_PUBLIC_CAPTCHA_PROVIDER: z.enum(['hcaptcha', 'turnstile']).optional(),
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),

    // Chat Service (Gemini)
    NEXT_PUBLIC_GEMINI_CHAT_MODEL: z.string().optional(),

    // Build metadata
    NEXT_PUBLIC_BUILD_TIMESTAMP: z.string().optional(),

    // Web Push
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),

    // Custom Site URL (for mirror deployments)
    NEXT_PUBLIC_SITE_URL: z.url().optional(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL: process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL,
    NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS,
    NEXT_PUBLIC_DISABLE_ARTICLES: process.env.NEXT_PUBLIC_DISABLE_ARTICLES,
    NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR: process.env.NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR,
    NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION: process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN:
      process.env.NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN,
    NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET,
    NEXT_PUBLIC_CAPTCHA_PROVIDER: process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER,
    NEXT_PUBLIC_CAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    NEXT_PUBLIC_GEMINI_CHAT_MODEL: process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === '1',
  emptyStringAsUndefined: true,
});
