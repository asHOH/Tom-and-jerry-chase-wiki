# Project

Tom and Jerry Chase Wiki is a Chinese game-data wiki for 猫和老鼠手游 (Tom and Jerry Chase mobile game). It uses
Next.js 16 App Router, React 19, strict TypeScript, and Tailwind CSS 4.

- Production: <https://tjwiki.com>
- Development preview: <https://dev.tjwiki.com>
- Primary UI language: `zh-CN`; product UI copy should be Chinese. This does not set the language of assistant responses.
- Design mobile-first; desktop layouts enhance the mobile baseline.
- Use the Node.js and npm versions declared in `package.json` (`engines`, `packageManager`, and `devEngines`).
- `DEPLOY.md` holds deployment options and environment setup; do not duplicate those details here.

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

Tests are colocated with source as `*.test.ts` or `*.test.tsx`. Use React Testing Library for
components and plain Jest for utilities. Jest only discovers tests under `src/`; `test/` currently
contains mocks and support files.

# Project Structure

```text
src/
├── app/                      # App Router pages, layouts, metadata, and route handlers
│   ├── (main)/               # Public routes using GlobalLayout
│   ├── admin/                # Dynamic admin UI
│   ├── api/                  # Route handlers
│   ├── maps/                 # Full-screen interactive map route outside (main)
│   ├── layout.tsx            # Root providers, fonts, analytics, and error boundary
│   └── globals.css           # Tailwind entry point; imports src/styles/*
├── features/                 # Domain modules: data, components, hooks, and helpers
├── components/               # Cross-feature and app-level components
│   └── ui/                   # Shared UI primitives
├── data/                     # Shared static data, generated data, types, and Valtio edit stores
├── lib/                      # Business logic and integrations
│   ├── edit/                 # Local editing, diffs, persistence, and action squashing
│   ├── gameData/             # Public game-data action replay and cache invalidation
│   └── supabase/             # Browser, RSC, public, admin, and proxy clients
├── hooks/                    # Cross-feature hooks
├── context/                  # Theme, edit mode, toast, and wiki-history providers
├── styles/                   # Global theme, base, typography, component, pattern, and animation CSS
├── testUtils/                # Shared test fixtures
└── env.ts                    # t3-oss/env-nextjs validation

scripts/                      # Generation, validation, reports, image processing, and ops scripts
supabase/migrations/          # Database schema history; add migrations rather than editing old ones
test/__mocks__/               # Jest-only mocks outside Jest's test discovery roots
```

# Architecture

## Game Data

- TypeScript and JSON data under `src/data/` and `src/features/*/data/` form the checked-in baseline.
- Approved public rows from Supabase `game_data_actions` are replayed over that baseline on the server and client. Keep server targets in `src/lib/gameData/publicActions.ts` and client targets in `src/hooks/usePublicGameDataActions.ts` aligned when adding an editable entity type.
- Valtio proxies in `src/data/store.ts` back local edit mode. Edit persistence, diff recording, and action replay live under `src/lib/edit/`; do not mutate the static baseline ad hoc.
- `scripts/generate-doc-pages.mjs` writes `src/data/generated/docPages.json`. Changelog generation writes `src/data/generated/changeLogs.json`. Do not edit generated JSON by hand.
- Actor-profile changes must pass `npm run validate:actor-profiles`; use the normalization script only when intentionally performing its mechanical rewrite.

## Rendering and Routing

- Server Components are the default. Add `'use client'` only where browser APIs, client state, or event handlers require it.
- Public catalog pages are generally static and detail routes commonly use `generateStaticParams`. Preserve each route's existing `dynamic` or `revalidate` contract when editing it.
- `trailingSlash: true` and `typedRoutes: true` are enabled. Use typed `Route` values where Next.js navigation needs help proving a dynamic path.
- React Compiler uses annotation mode. Preserve deliberate compiler directives such as `'use no memo'`; do not add compiler annotations casually.
- `src/proxy.ts` is the request proxy. It refreshes Supabase sessions and applies preview no-index behavior; this project does not use a legacy root `middleware.ts`.

## Dynamic Services and State

- Supabase-backed articles, comments, users, permissions, notifications, and game-data actions are dynamic. Client-side API reads generally use SWR.
- `src/lib/supabase/client.ts`: browser singleton.
- `src/lib/supabase/server.ts`: cookie-aware, cached RSC/route-handler client; call await createClient()`.
- `src/lib/supabase/public.ts`: server-only publishable-key client for unauthenticated public reads.
- `src/lib/supabase/admin.ts`: server-only secret-key client with elevated privileges. Never import it into client code or expose its key.
- Auth routes implement password hashing, rate limiting, and configurable hCaptcha or Turnstile. Preserve the existing helpers and the optional CAPTCHA behavior when provider secrets are absent.
- Valtio handles shared reactive/editable state. React context and `next-themes` handle scoped UI state. SWR handles API caching; do not introduce another state layer without a clear need.

## Environment and PWA

- Add or change environment variables in `src/env.ts` and mirror public variables in `experimental__runtimeEnv`. Keep `.env.example` and relevant deployment documentation in sync.
- `SKIP_ENV_VALIDATION=1` bypasses validation. `SKIP_BUILD_CHECKS=true` only controls Next's TypeScript build-error handling; neither should be a normal development default.
- Serwist builds `public/sw.js` from `src/sw.ts` using `serwist.config.mjs`. The service worker is disabled in development. Do not hand-maintain generated service-worker output.

# Code Conventions

Formatting and lint-enforced details are intentionally omitted here. Treat Prettier and Oxlint as their source of truth.

## TypeScript and Imports

- Strict checks include `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noUncheckedIndexedAccess`.
- Prefer `type` aliases for new local shapes. Use `interface` where extension, declaration merging, generated definitions, or established adjacent code makes it clearer.
- Prefix intentionally unused parameters with `_`.
- Use `@/` for imports across project areas. Use relative imports for files in the same local module.

## React and Components

- Use functional components. Define props directly above the component and extend native element attributes when wrapping an HTML element.
- Page modules and UI primitives generally use default exports. Utilities, hooks, and types use named
  exports. Follow the established pattern in the directory you are editing.
- Use `cn` from `@/lib/design` for conditional classes, reusable class composition, or merging an
  incoming `className`.
- Prefer Tailwind for static styling. Use global CSS in `src/styles/` for shared tokens and patterns,
  and inline `style` only for runtime-computed values or values Tailwind cannot express cleanly.
- Keep dark-mode behavior via `dark:` variants and the existing theme tokens. Test both themes when
  changing colors.
- Use responsive Tailwind prefixes and existing media/gesture hooks for mobile behavior.

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

# Validation, Git Hooks, and CI

Choose validation in proportion to the change:

- Source changes: run `npm run lint`, `npm run type-check`, and relevant tests.
- Broad or cross-cutting changes: run full `npm test` suite.
- Markdown-only changes: run Prettier on/check the changed file; source tests are unnecessary.
- Actor-profile data changes: also run `npm run validate:actor-profiles`.
- Build/config/generation changes: run `npm run build:skip-images` when practical.

Git hooks:

- `pre-commit`: resets a generated service-worker cache version when necessary, then runs lint-staged Oxlint with warnings denied and Prettier with write mode.
- `commit-msg`: enforces `type(scope): description`; allowed types are `feat|fix|docs|style|refactor|perf|test|chore`. Breaking-change `!`, merge, and revert commits are supported.
- `pre-push`: syncs README acknowledgments when contributors change, runs Oxlint and Prettier, then type-checks in parallel with changed tests on feature/development branches or full CI tests on main-like branches.

GitHub Actions runs on pushes and pull requests to `main` and `develop`. CI validates actor profiles, runs Prettier/Oxlint/TypeScript in parallel, then runs Jest and coverage with Codecov upload. Use `develop` for the development.
