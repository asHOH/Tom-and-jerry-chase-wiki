# Project

Tom and Jerry Chase Wiki, whose Chinese name is 猫和老鼠手游百科 (short name 猫鼠百科), is a Chinese game-data wiki for 猫和老鼠手游 (Tom and Jerry Chase mobile game). It uses Next.js 16 App Router, React 19, strict TypeScript, and Tailwind CSS 4.

- Production (VPS+Cloudflared): <https://www.tjwiki.com>
- Development preview (Vercel): <https://dev.tjwiki.com>
- Codex agents: use the Vercel plugin for platform guidance and preview deployment/log diagnostics. `DEPLOY.md` governs production deployment and environment setup.
- If `.codex/AGENTS.md` exists, read it before starting task work and treat it as private, project-local operator context. The file is intentionally untracked and may be absent.
- Product UI language: `zh-CN`. This does not set the language of assistant responses.
- Design mobile-first.
- Use the Node.js and npm versions declared in `package.json` (`engines`, `packageManager`, and `devEngines`).
- If you discover an important gap or error in the project documentation, report it in your final response and suggest a correction.

# Commands

```powershell
# Development and builds
npm run dev                    # Next.js dev server on localhost:3000
npm run build                  # Validate profiles, generate docs, optimize/index images, build Next/Serwist
npm run build:skip-images      # Same build without image optimization

# Quality
npm run lint                   # Oxlint
npm run prettier:check         # Check formatting
npm run type-check             # tsc --noEmit

# Tests
npm test                       # All Jest tests
npm run test:scripts           # Node.js tests under scripts/ and scripts/lib/
npm test -- path/to/file.test.ts
```

See `package.json` for other scripts. Tests are colocated as `*.test.ts` or `*.test.tsx`; use React Testing Library for components and plain Jest for utilities. Jest discovers tests under `src/`; `test/` holds mocks and support files. Script tests use Node.js's test runner separately; do not invoke `.test.mjs` files from Jest wrappers.

# Project Structure

- `src/app/`: routes, layouts, metadata, and API handlers; `(main)/` uses `GlobalLayout`.
- `src/features/`: domain modules. `src/components/`, `src/hooks/`, and `src/context/`: shared UI, hooks, and providers.
- `src/data/`: baseline/generated data, types, and edit stores. `src/lib/`: business logic and integrations. `src/styles/`: shared CSS and theme tokens.
- `scripts/`: generation, validation, reports, image processing, and operations. `supabase/migrations/`: database schema history.

After changing Supabase migrations or the pinned Supabase CLI version, replay the local database, run `npm run generate:database-types`, and commit any changes to `src/data/database.generated.ts` in the same PR. Follow the upgrade and validation steps in [the Supabase migration runbook](docs/operations/supabase-migrations.md). Do not manually edit that generated file.

The Supabase CLI may be linked to production. Verify the target and dry run before each remote database migration push; use `STAGING_DATABASE_URL` with `--db-url` for `tjwiki-test`. Preserve the version and SQL of remotely applied migrations; make corrections in new migrations. For Data API objects, follow the runbook's explicit grants and RLS requirements.

# Architecture

## Game Data

- TypeScript and JSON data under `src/data/` and `src/features/*/data/` form the checked-in baseline.
- Approved public rows from Supabase `game_data_actions` are composed with the checked-in baseline by the server-only modules under `src/lib/gameData/published/`. Public rendering should read through `getPublishedDomainReadModel` or `getPublishedEntityRouteReadModel`, not import the static baseline for render-time entity lookup. When adding an editable entity type, keep `publishableEntityTypes.ts`, the published data types and canonical sources, the edit stores and registry, and their exhaustiveness tests aligned.
- Approved `game_data_actions` may update existing characters; new root-level characters must enter through the checked-in baseline, whose membership distinguishes public characters from local drafts.
- New submissions require a UUID v4 `Idempotency-Key` and the atomic request RPC. Reject unsupported character fields, contradictory explicit relations, new character roots, and rows with no net change. Keep `src/lib/gameData/characterDataValidation.ts` aligned when adding character fields. Unchanged container checks may remain within a real edit.
- Local edit mode lazily fetches the published baseline in `src/components/EditRuntime.tsx` and installs one `EditSession`. Feature code must use the typed editable-data hooks or session draft APIs; do not import raw edit stores, registry topology, subscribers, or browser-history helpers. Tests should use the behavior-oriented helpers in `src/testUtils/editRuntime.ts` and mutate/read through the session interface; shared action types and pure replay helpers remain available to server-side modules.
- `scripts/generate-doc-pages.mjs` writes `src/data/generated/docPages.json`. Changelog generation writes `src/data/generated/changeLogs.json`. Do not hand-edit generated JSON.
- `npm run generate:history-dates` derives `src/data/generated/historyDates.json` from the game timeline. Regenerate it after editing `src/data/history.ts`; development startup and builds also refresh it.
- New characters also need registration in `src/features/characters/data/characterMetadata.ts` and a canonical actor profile. When verified attributes are pending, explicitly list the character in `src/features/actor-profiles/pendingProfiles.ts`; character views show pending attributes and omit statistics from rankings and games. Remove that entry when adding the verified profile. Never use placeholder numbers as canonical statistics.

## Rendering and Routing

- Server Components are the default. Add `'use client'` only where browser APIs, client state, or event handlers require it.
- Public catalog pages are generally static and detail routes commonly use `generateStaticParams`. Preserve each route's existing `dynamic` or `revalidate` contract when editing it.
- `trailingSlash: true` and `typedRoutes: true` are enabled. Use typed `Route` values where Next.js navigation needs help proving a dynamic path.
- React Compiler uses annotation mode. Preserve deliberate compiler directives such as `'use no memo'`; do not add compiler annotations casually.
- `src/proxy.ts` is the request proxy. It refreshes Supabase sessions and applies preview no-index behavior; this project does not use a legacy root `middleware.ts`.
- New public routes should follow adjacent metadata, canonical URL, structured-data, robots, and sitemap patterns.
- For pages combining published domains, share an approved-action snapshot and register the consumed revisions. Follow `src/app/(main)/relations/page.tsx` and `PublishedRevisionBoundary`.

## Dynamic Services and State

- Supabase-backed articles, comments, users, permissions, notifications, and game-data actions are dynamic.
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

- Define application environment variables in `src/env.ts` and mirror public variables in `experimental__runtimeEnv`. Keep `.env.example` and relevant deployment documentation in sync; script-only and deployment-only variables follow their owning tool.
- `SKIP_ENV_VALIDATION=1` bypasses validation. `SKIP_BUILD_CHECKS=true` only controls Next's TypeScript build-error handling; neither should be a normal development default.
- Serwist builds `public/sw.js` from `src/sw.ts` using `serwist.config.mjs`. The service worker is disabled in development. Do not hand-maintain generated service-worker output.
- Keep editing/admin workflows excluded from offline caching. Follow `docs/operations/offline-browsing.md` when changing navigation or caching.

# Code Conventions

Formatting and lint-enforced details are intentionally omitted here. Treat Prettier, tsc and Oxlint as their source of truth.

## TypeScript and Imports

- Prefer `type` aliases for new local shapes. Use `interface` where extension, declaration merging, generated definitions, or established adjacent code makes it clearer.
- Use `@/` for imports across project areas. Use relative imports for files in the same local module.

## React and Components

Before adding UI, search `src/components/` and the relevant feature for an existing component. Read its props and one caller, then reuse or compose it when its behavior fits. Keep domain-specific UI in its feature; extend shared components only for shared behavior.

Reusable entry points (under `src/components/ui/` unless qualified):

- Layout: `PageShell`, `PageHeader`, `CatalogPageShell`, `SectionNavigationShell`.
- Cards/lists: `Card`, `EntityCardFrame`, `CatalogCard`, `CatalogGrid`.
- Actions/forms: `Button`, `ButtonLink`, `IconButton`; `FormInput`, `FormSelect`, `FormTextarea` from `FormControls.tsx`.
- Overlays: `Tooltip`; `BaseDialog` handles layering, focus, scroll locking, and reduced motion.
- Internal navigation: `@/components/Link` and `@/hooks/useNavigation` preserve offline navigation and progress behavior; `Link` also manages the edit parameter.
- Images: `@/components/Image` handles generated formats and optimization settings; `GameImage` provides established game-image layouts.

- Define props directly above the component and extend native element attributes when wrapping an HTML element.
- Page modules and UI primitives generally use default exports. Utilities, hooks, and types use named exports. Follow the established pattern in the same directory.
- Reuse `@/lib/design` styling helpers; use `cn` for conditional classes and merging `className`.
- Prefer Tailwind for static styling. Use global CSS in `src/styles/` for shared tokens and patterns, and inline `style` only for runtime-computed values or values Tailwind cannot express cleanly.
- Prefer numeric sizing utilities (e.g. `min-h-105`, `min-w-30`) over arbitrary pixels (`min-h-[420px]`, `min-w-[120px]`), unless fixed CSS pixels are intentional; numeric sizes follow the rem-based spacing scale.
- Keep dark-mode behavior via `dark:` variants and the existing theme tokens. Test both themes when changing colors.
- Use responsive Tailwind prefixes, `useMobile` from `src/hooks/useMediaQuery.ts`, and `useSwipeGesture` for mobile behavior.
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
- Scripts or script-test configuration: run `npm run test:scripts`.
- Markdown-only: run `npx prettier --write <changed-file>` and check formatting; source tests are unnecessary.
- Actor-profile data: also run `npm run validate:actor-profiles`.
- Build/config/generation: avoid running `npm run build:skip-images` unless necessary.

Git hooks and CI enforce formatting, linting, type-checking, tests, generated database types, and conventional commit messages. Treat their executable configuration as the source of truth.
