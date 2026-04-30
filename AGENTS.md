# Project Info

Tom and Jerry Chase Wiki — a game data wiki for 猫和老鼠手游 (Tom and Jerry Chase mobile game).
Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4.

- **Production**: Container → Cloudflare Tunnel → tjwiki.com
- **Dev preview**: Vercel → dev.tjwiki.com
- **Language**: zh-CN (all user-facing text is Chinese)
- **Audience**: Mobile-heavy (70%+ mobile traffic). Mobile-first design.

# Commands

```powershell
# Dev
npm run dev                        # Start dev server (localhost:3000)
npm run build                      # Full build: generate-doc-pages → next build → image optimization
npm run build:skip-images          # Build without post-build image optimization

# Quality (run after every edit)
npm run lint                       # ESLint (cached). Zero warnings required for push.
npm run lint:fast                  # Oxlint (quick sanity check)
npm run type-check                 # tsc --noEmit (strict mode + noUncheckedIndexedAccess)
npm run format                     # Prettier + ESLint auto-fix

# Test
npm test                           # Jest (all tests)
npm test -- --testPathPatterns=filterUtils   # Single test file by name (Jest 30: plural)
npm test -- path/to/file.test.ts   # Single test file by path
npm run test:watch                 # Watch mode
npm run test:changed               # Only tests for changed files (used by pre-push on branches)
npm run test:coverage              # Generate coverage report
npm run test:ci                    # CI mode: --ci --coverage --maxWorkers=50%
```

Test files live next to source: `src/lib/foo.test.ts`, `src/components/ui/Foo.test.tsx`. Pattern: `describe('ModuleName', () => { it('should ...') })`. Use React Testing Library for components, plain Jest for utils.

# Git Hooks (Husky)

- **pre-commit**: `lint-staged` runs `oxlint --deny-warnings` + `prettier --write` on staged JS/TS files; `prettier --write` on JSON/CSS/MD.
- **commit-msg**: Enforces conventional commits: `type(scope): description`. Types: `feat|fix|docs|style|refactor|perf|test|chore`. Merge/Revert commits exempt.
- **pre-push**: Lint (zero warnings) → Prettier check → type-check + tests in parallel. Feature branches run `test:changed`; main/master run full `test:ci`.

# Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/             # Route group: all public pages (characters, cards, items, etc.)
│   ├── admin/              # Admin panel pages
│   ├── api/                # API route handlers
│   ├── layout.tsx          # Root layout (fonts, providers, CSP)
│   └── globals.css         # Tailwind entry point
├── features/               # Feature modules (self-contained)
│   ├── characters/         # components/, data/, hooks/, utils/
│   ├── entities/           # Entity grid/detail
│   ├── special-skills/     # Special skill grid/detail/data
│   ├── modes/              # Game modes
│   ├── shared/             # Cross-feature: DetailShell, traits, tooltips
│   └── ...
├── components/             # Shared UI components
│   ├── ui/                 # Primitives: Button, Card, SearchBar, etc.
│   └── *.tsx               # App-level: ErrorBoundary, TabNavigation, LoginDialog
├── data/                   # Static game data & types
│   ├── types.ts            # Core type definitions (Character, Skill, KnowledgeCard, etc.)
│   ├── index.ts            # Re-exports all data
│   ├── generated/          # Build-time generated (docPages.json — don't edit manually)
│   └── *.ts                # achievements, maps, traits, winRates, etc.
├── lib/                    # Utils & business logic
│   ├── supabase/           # client.ts (browser), server.ts (RSC), admin.ts (service-role)
│   ├── design.ts           # Design tokens, button/color utilities
│   └── *.ts                # filterUtils, textUtils, assetManager, etc.
├── hooks/                  # Custom React hooks (useUser, useSwipeGesture, useChat, etc.)
├── context/                # React Context providers (DarkMode, EditMode, App, Toast)
├── constants/              # SEO metadata, config constants
└── env.ts                  # t3-oss/env-nextjs validation (Zod schemas for all env vars)
scripts/                    # Build scripts (generate-doc-pages.mjs, image optimization, etc.)
```

# Code Style

## TypeScript

- **Strict mode** with extra checks: `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`.
- Use `type` keyword for type aliases (not `interface` unless extending). Props are typed inline: `type FooProps = { ... }`.
- Prefix unused params with `_` (enforced by ESLint `unused-imports` plugin).
- Path alias: `@/` maps to `src/`. Always use it for non-relative imports.
- Never use `as any`, `@ts-ignore`, or `@ts-expect-error`.

## Formatting (Prettier)

- Single quotes, JSX single quotes, semicolons, trailing commas (es5).
- Print width: 100. Tab width: 2. End of line: LF.
- Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Import order automated by `@ianvs/prettier-plugin-sort-imports`

## Components

- Functional components only. Arrow functions or `forwardRef` pattern.
- Client components: `'use client'` directive at top. Server components are the default.
- Props: `type FooProps = { ... }` above the component. Extend HTML attributes when wrapping native elements.
- Default exports for page-level and UI primitive components. Named exports for utilities and types.
- Use `cn` from `@/lib/design` for conditional or composed classes. It wraps `clsx` and `tailwind-merge`.

## Naming

- Components: `PascalCase.tsx` (e.g., `SearchBar.tsx`, `CharacterGrid.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useSwipeGesture.ts`)
- Utils/lib: `camelCase.ts` (e.g., `filterUtils.ts`, `textUtils.ts`)
- Data files: `camelCase.ts` (e.g., `catCharacters.ts`)
- Test files: `*.test.ts` / `*.test.tsx` co-located with source
- Feature directories: `kebab-case` (e.g., `character-detail/`, `special-skill-grid/`)
- Barrel exports: `index.ts` files in feature component directories

## Error Handling

- API routes: Return `NextResponse.json({ error: '...' }, { status: 4xx/5xx })`.
- Client: `ErrorBoundary` component wraps the app. Component-level try/catch where needed.
- Empty `catch {}` blocks are forbidden. At minimum, log or re-throw.

## Comments

- Prefer semantic names over comments.
- Add comments only for complex logic, non-obvious algorithms, or public API contracts.

# Architecture Notes

## Data Layer

- **Static game data**: TypeScript files in `src/data/` and `src/features/*/data/`. Imported directly — no runtime fetch needed.
- **Dynamic content** (articles, user data): Supabase via API routes. Client fetches with SWR.
- **Build-time generated**: `scripts/generate-doc-pages.mjs` produces `src/data/generated/docPages.json`. Import the JSON file; never use `fs` in RSC.
- **Static-first rendering**: Default to SSG via `generateStaticParams`. Use ISR only when data changes outside deploys. Characters detail uses ISR (`revalidate = 28800`).

## Supabase

- **Browser client** (`src/lib/supabase/client.ts`): Singleton. Used in client components/hooks.
- **Server client** (`src/lib/supabase/server.ts`): `await createClient()` in RSC/Route Handlers. Uses `cookies()` bridge + `fetchWithRetry`.
- **Public client** (`src/lib/supabase/public.ts`): Anon key, no cookies/session. For safe server-only public reads.
- **Admin client** (`src/lib/supabase/admin.ts`): Service-role key. Server-only. **Never import in client code.**
- **Session middleware** (`src/lib/supabase/middleware.ts`): Deep-imports `createServerClient` for Edge-safe session cookie sync. Called from Next middleware if present.
- Auth uses SHA-256/PBKDF2 password hashing. Captcha required on auth routes.
- Reads use views (`users_public_view`, `article_versions_public_view`). Writes use RPCs with RLS.

## State Management

- **Valtio**: Global reactive state (user info, app context). Stores in `src/context/` and `src/data/store.ts`.
- **SWR**: Data fetching with caching for API-backed content.
- **React Context**: Theme (DarkMode), EditMode, Toast notifications.

## Environment

- Validated at build time via `src/env.ts` (t3-oss/env-nextjs + Zod).
- Feature flags: `NEXT_PUBLIC_DISABLE_ARTICLES`, `NEXT_PUBLIC_DISABLE_FEEDBACK_EMAIL`, etc.
- Skip validation: `SKIP_ENV_VALIDATION=1`.

## React Compiler

- Enabled in `annotation` mode (`next.config.ts → reactCompiler.compilationMode: 'annotation'`).
- Only compiles components/hooks annotated with `'use memo'` or similar directives.

## PWA

- Service worker via `@serwist/next` (`src/sw.ts` → `public/sw.js`).
- Disabled in development. Pre-commit hook resets SW cache version placeholder.

## Key Config

- `trailingSlash: true` in Next.js config — all routes end with `/`.
- `typedRoutes: true` — use `Route` type for navigation safety.
- Webpack fallback: `fs`, `net`, `tls` set to `false` for client bundles.

# UI Rules

- Tailwind classes for all static styling. No CSS modules, no styled-components.
- Static one-off `className` strings can stay inline. Use `cn(...)` when classes are conditional, merged with incoming `className`, or assembled from reusable constants.
- Avoid template literals for `className`; prefer `cn('base classes', condition && 'conditional classes', className)`.
- Reusable component variants should use typed maps or helper functions, not repeated ad hoc class strings.
- Inline `style` prop: ONLY for runtime-computed values (dynamic transforms, positions).
- Mobile-first: Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). `useMobile` hook for gesture behavior.
- Dark mode: Tailwind `dark:` variant. `DarkModeProvider` context.
- Animations: `motion` library (Framer Motion successor).

# Post-Edit Checklist

```powershell
npm run lint            # Must pass with zero warnings
npm run type-check      # Must pass
npm test                # Run relevant tests
```

Commit format: `type(scope): description` — e.g., `feat(characters): add win rate display`

# CI Pipeline

GitHub Actions on push/PR to `main`/`develop`:

1. **Code Quality** (parallel matrix): Prettier check, ESLint, TypeScript type-check
2. **Tests & Coverage**: Jest with coverage report → Codecov

CI test detection scans `src/`, `tests/`, and `__tests__/` for `*.test.ts`, `*.test.tsx`, `*.spec.ts`, and `*.spec.tsx`. If matches exist, CI runs tests and coverage; otherwise it reports no tests found.

Branches: `develop` (dev preview), `main` (production).
