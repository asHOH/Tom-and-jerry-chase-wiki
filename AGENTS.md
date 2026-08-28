# Project

Tom and Jerry Chase Wiki is a Chinese game-data wiki for 猫和老鼠手游 (Tom and Jerry Chase mobile game). It uses Next.js 16 App Router, React 19, strict TypeScript, and Tailwind CSS 4.

- Production (VPS+Cloudflared): <https://www.tjwiki.com>
- Development preview (Vercel): <https://dev.tjwiki.com>
- Codex agents: use the Vercel plugin for vercel platform guidance and preview deployment/log diagnostics; production deployment remains governed by `DEPLOY.md`.
- If `.codex/AGENTS.md` exists, read it before starting task work and treat it as private, project-local operator context. The file is intentionally untracked and may be absent.
- Product UI language: `zh-CN`. This does not set the language of assistant responses.
- Design mobile-first.
- Use the Node.js and npm versions declared in `package.json` (`engines`, `packageManager`, and `devEngines`).
- `DEPLOY.md` holds deployment options and environment setup; do not duplicate those details here.
- If you discover an important gap or error in the project documentation, report it in your final response and suggest a correction.

# Commands

```powershell
# Development and builds
npm run dev                    # Next.js dev server on localhost:3000
npm run build                  # Validate actor profiles, generate docs, build Next/Serwist, optimize images
npm run build:skip-images      # Same build without post-build image optimization

# Quality
npm run lint                   # Oxlint
npm run lint:fix               # Oxlint auto-fix
npm run prettier:check         # Check formatting
npm run prettier:fix           # Format the repository
npm run format                 # Prettier, then Oxlint auto-fix
npm run type-check             # tsc --noEmit
npm run validate:actor-profiles

# Tests
npm test                       # All Jest tests
npm test -- path/to/file.test.ts
npm test -- --testPathPatterns=filterUtils
npm run test:watch
npm run test:changed           # Tests related to changed files; passes when none are found
npm run test:coverage
npm run test:ci                # CI Jest mode with coverage and 50% workers
```

Tests are colocated with source as `*.test.ts` or `*.test.tsx`. Use React Testing Library for components and plain Jest for utilities. Jest only discovers tests under `src/`; `test/` currently contains mocks and support files.

# Project Structure

```text
src/
├── app/                      # App Router pages, layouts, metadata, and route handlers
│   ├── (main)/               # Public routes using GlobalLayout
│   ├── admin/                # Dynamic admin UI
│   ├── api/                  # Route handlers
│   └── maps/                 # Full-screen interactive map route outside (main)
├── features/                 # Domain modules: data, components, hooks, and helpers
├── components/               # Cross-feature and app-level components
│   └── ui/                   # Shared UI primitives
├── data/                     # Shared static data, generated data, types, and Valtio edit stores
├── lib/                      # Business logic and integrations
├── hooks/                    # Cross-feature hooks
├── context/                  # Theme, edit mode, toast, and wiki-history providers
└── styles/                   # Global theme, base, typography, component, pattern, and animation CSS

scripts/                      # Generation, validation, reports, image processing, and ops scripts
supabase/migrations/          # Database schema history; add migrations rather than editing old ones
test/__mocks__/               # Jest-only mocks outside Jest's test discovery roots
```

After changing Supabase migrations, replay the local database, run `npm run generate:database-types`, and commit `src/data/database.generated.ts`. Do not manually edit that generated file.

# Architecture

## Game Data

- TypeScript and JSON data under `src/data/` and `src/features/*/data/` form the checked-in baseline.
- Approved public rows from Supabase `game_data_actions` are composed with the checked-in baseline by the server-only modules under `src/lib/gameData/published/`. Public rendering should read through `getPublishedDomainReadModel` or `getPublishedEntityRouteReadModel`, not import the static baseline for render-time entity lookup. When adding an editable entity type, keep `publishableEntityTypes.ts`, the published data types and canonical sources, the edit stores and registry, and their exhaustiveness tests aligned.
- Approved `game_data_actions` may update existing characters but must not add a new root-level `characters` entry; introduce new characters through the checked-in baseline instead. Character navigation currently uses checked-in membership to distinguish public characters from local drafts, so violating this invariant can misclassify an approved character as draft-only and route links through `/characters/user/...` until the baseline catches up.
- Local edit mode lazily fetches the published baseline in `src/components/EditRuntime.tsx` and creates Valtio proxies through `src/lib/edit/editStores.ts`. Edit persistence and diff recording live under `src/lib/edit/`; do not mutate the static baseline ad hoc. Tests that need edit proxies should use `src/testUtils/editRuntime.ts` and its supported runtime seam; do not create eager global edit stores.
- `scripts/generate-doc-pages.mjs` writes `src/data/generated/docPages.json`. Changelog generation writes `src/data/generated/changeLogs.json`. Do not hand-edit generated JSON.
- Actor-profile changes must pass `npm run validate:actor-profiles`.

## Rendering and Routing

- Server Components are the default. Add `'use client'` only where browser APIs, client state, or event handlers require it.
- Public catalog pages are generally static and detail routes commonly use `generateStaticParams`. Preserve each route's existing `dynamic` or `revalidate` contract when editing it.
- `trailingSlash: true` and `typedRoutes: true` are enabled. Use typed `Route` values where Next.js navigation needs help proving a dynamic path.
- React Compiler uses annotation mode. Preserve deliberate compiler directives such as `'use no memo'`; do not add compiler annotations casually.
- `src/proxy.ts` is the request proxy. It refreshes Supabase sessions and applies preview no-index behavior; this project does not use a legacy root `middleware.ts`.
- New public routes should follow adjacent metadata, canonical URL, structured-data, robots, and sitemap patterns.

## Dynamic Services and State

- Supabase-backed articles, comments, users, permissions, notifications, and game-data actions are dynamic. Client-side API reads generally use SWR.
- `src/lib/supabase/client.ts`: browser singleton.
- `src/lib/supabase/server.ts`: cookie-aware, cached RSC/route-handler client; call `await createClient()`.
- `src/lib/supabase/public.ts`: server-only publishable-key client for unauthenticated public reads.
- `src/lib/supabase/admin.ts`: server-only secret-key client with elevated privileges. Never import it into client code or expose its key.
- Supabase-backed functionality must degrade safely when articles are disabled or credentials are absent. Choose optional versus required client helpers deliberately.
- Run `scripts/ops/measure-admin-game-data-actions.sql` only against the `tjwiki-test` project via `STAGING_DATABASE_URL`, never production.
- Auth routes implement password hashing, rate limiting, and configurable hCaptcha or Turnstile. Preserve the existing helpers and the optional CAPTCHA behavior when provider secrets are absent.
- Valtio handles shared reactive/editable state. React context and `next-themes` handle scoped UI state. SWR handles API caching; do not introduce another state layer without a clear need.
- When a mutation changes publicly rendered data, update the corresponding cache-tag invalidation, including sitemap and aggregate tags where applicable.

## Environment and PWA

- Add or change environment variables in `src/env.ts` and mirror public variables in `experimental__runtimeEnv`. Keep `.env.example` and relevant deployment documentation in sync.
- `SKIP_ENV_VALIDATION=1` bypasses validation. `SKIP_BUILD_CHECKS=true` only controls Next's TypeScript build-error handling; neither should be a normal development default.
- Serwist builds `public/sw.js` from `src/sw.ts` using `serwist.config.mjs`. The service worker is disabled in development. Do not hand-maintain generated service-worker output.

# Code Conventions

Formatting and lint-enforced details are intentionally omitted here. Treat Prettier, tsc and Oxlint as their source of truth.

## TypeScript and Imports

- Prefer `type` aliases for new local shapes. Use `interface` where extension, declaration merging, generated definitions, or established adjacent code makes it clearer.
- Use `@/` for imports across project areas. Use relative imports for files in the same local module.

## React and Components

- Define props directly above the component and extend native element attributes when wrapping an HTML element.
- Page modules and UI primitives generally use default exports. Utilities, hooks, and types use named exports. Follow the established pattern in the same directory.
- Use `cn` from `@/lib/design` for conditional classes, reusable class composition, or merging an incoming `className`.
- Prefer Tailwind for static styling. Use global CSS in `src/styles/` for shared tokens and patterns, and inline `style` only for runtime-computed values or values Tailwind cannot express cleanly.
- Keep dark-mode behavior via `dark:` variants and the existing theme tokens. Test both themes when changing colors.
- Use responsive Tailwind prefixes and existing media/gesture hooks for mobile behavior.
- Preserve keyboard navigation, visible focus states, semantic and ARIA behavior, reduced-motion handling, and touch usability when changing interactive UI.

## Error Handling and Security

- Route handlers return structured `NextResponse.json({ error: '...' }, { status })` failures.
- Do not leave empty `catch` blocks. Log, rethrow, or include a comment only when ignoring the error is intentional and safe.
- Preserve permission checks, rate limits, input validation, RLS/RPC boundaries, and `server-only` imports when modifying APIs or Supabase access.
- Treat rendered rich text and user-controlled URLs as untrusted; use the existing sanitization and URL-validation helpers.

## Encoding

- Source files are UTF-8. Treat Chinese mojibake in Windows PowerShell as a display problem.
- Before inspecting Chinese text in PowerShell, set the session to UTF-8, then prefer `rg` or `Get-Content -Encoding UTF8`:

  ```powershell
  [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  chcp 65001 | Out-Null
  ```

# Validation and CI

Validate in proportion to the scope of change:

- Source: run `npm run lint`, `npm run type-check`, and relevant tests.
- Broad or cross-cutting: run full `npm test` suite.
- Markdown-only: run Prettier on the changed file; source tests are unnecessary.
- Actor-profile data: also run `npm run validate:actor-profiles`.
- Build/config/generation: run `npm run build:skip-images` when practical.

Git hooks and CI enforce formatting, linting, type-checking, tests, generated database types, and conventional commit messages. Treat their executable configuration as the source of truth.
