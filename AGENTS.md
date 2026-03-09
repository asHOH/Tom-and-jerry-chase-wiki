# Project Info

Tom and Jerry Chase Wiki
Next.js 16, React 19, TS

- Deploy: Vercel (Dev), Container/Cloudflare (Prod)
- Lang: zh-CN
- Core: Characters, Knowledge Cards, Articles (Supabase), PWA
- Principles: Mobile-first, Performance, a11y

# Tech Stack

- Node >= 20, npm >= 10
- UI: Tailwind CSS 4
- State: Valtio (global), SWR
- Data: Static TS (game data), Supabase (user/content)
- Build: SSG/ISR. `scripts/generate-doc-pages.mjs` for docs
- Tools: ESLint, Prettier, Husky, Jest, RTL

# Supabase

- Clients:
  - `src/lib/supabase/client.ts`: Browser singleton
  - `src/lib/supabase/server.ts`: RSC/Route Handlers (cookies)
  - `src/lib/supabase/admin.ts`: Service-role (server-only)
- Auth: SHA-256/PBKDF2. Passwords mandatory. `src/middleware.ts` syncs sessions. Captcha required on auth routes.
- Data Flow:
  - Read: `users_public_view`, `article_versions_public_view`
  - Write: RPCs enforce RLS/roles server-side
- Security: Never expose service key. Use `createClient()` in handlers. CORS restricted to origin. CSP allows `unsafe-inline` for articles.

# Structure

- `src/app`: App Router
- `src/components`: UI components
- `src/data`: Static game data/types
- `src/lib`: Utils & Supabase
- `src/context`: Valtio state
- `scripts/`: Build scripts

# Guidelines

- Style: Concise, no filler
- Code: TS strict, named exports, `@/` alias
- Comments: For complex logic only; prefer semantic names
- Shell: PowerShell

# UI Rules

- Inline styles: ONLY runtime-computed (transform/position)
- Static layout: Tailwind classes
- Mobile: Tailwind for styles, `useMobile` hook for behavior (gestures)

# Post-Edit

1. `npm run lint; npm run type-check`
2. Verify static optimization
3. Draft commit: `type(scope): message`
