# Project Info

**Tom and Jerry Chase Wiki** (Next.js 16, React 19, TypeScript).

- **Deploy**: Vercel (Dev), Container/Cloudflare (Prod).
- **Lang**: Chinese (zh-CN).
- **Core**: Characters, Knowledge Cards, Community Articles (Supabase), PWA.
- **Principles**: Mobile-first (70%+ traffic), Performance, Accessibility.

# Tech Stack

- **Runtime**: Node >= 20, npm >= 10.
- **UI**: Tailwind CSS 4, Mobile-first.
- **State**: Valtio (global), SWR (data).
- **Data**: Static TS files (game data), Supabase (articles/users).
- **Build**: Static-first (SSG), ISR for dynamic content. `scripts/generate-doc-pages.mjs` for docs index.
- **Tools**: ESLint, Prettier, Husky, Jest, React Testing Library.

# Supabase Integration

- **Clients**:
  - `src/lib/supabase/client.ts`: Browser client (singleton).
  - `src/lib/supabase/server.ts`: RSC/Route Handler client (cookies bridge).
  - `src/lib/supabase/admin.ts`: Service-role client (server-only, privileged).
- **Auth**: Custom auth flow (SHA-256/PBKDF2). `src/middleware.ts` syncs sessions.
- **Data Flow**:
  - **Read**: Public views (`users_public_view`, `article_versions_public_view`).
  - **Write**: RPCs for mutations/moderation to enforce RLS/roles server-side.
- **Security**: Never expose service key. Use `createClient()` in handlers for auth context.

# Structure

- `src/app`: App Router (pages, API).
- `src/components`: UI & Displays.
- `src/data`: Static game data & types.
- `src/lib`: Utilities & Supabase clients.
- `src/context`: Global state (Valtio wrappers).
- `scripts/`: Build/maintenance scripts.

# Guidelines

- **Style**: Concise replies. No filler.
- **Code**: TypeScript strict mode. Prefer named exports. Use `@/` alias.
- **Comments**: Only for complex logic. Use meaningful names instead.
- **Shell**: PowerShell.

# Post-Edit Checklist

1. Run checks: `npm run lint; npm run type-check`
2. Verify best practices & static optimization.
3. Draft commit: `feat|fix|docs|style|refactor|perf|test|chore(scope): ...`
