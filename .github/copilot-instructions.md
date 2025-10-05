# Project Information

This is a fan-made wiki website for the mobile game "Tom and Jerry Chase" (猫和老鼠手游). The site provides comprehensive data and tools for players to look up character information, knowledge cards, and game mechanics.

- **Type**: Next.js Application
- **Framework**: Next.js 15 with App Router architecture
- **React**: React 19 with TypeScript for type safety
- **Deployment**: Vercel
- **Language**: Chinese (zh-CN)
- **Architecture**: Client-side and Server-side (Next.js)
- **Security**: Standard Next.js security practices
- **Target Audience**: Chinese-speaking players of the Tom and Jerry Chase mobile game

## Core Features

- **Character Database**: Detailed information about cat and mouse characters including stats, skills, and recommended builds
- **Knowledge Cards**: Complete database of knowledge cards with effects and filtering capabilities
- **Search & Filter**: Advanced search and filtering system with Chinese pinyin support
- **Skill Point Calculator**: Tools for optimizing character skill allocations
- **Progressive Web App**: Offline-capable PWA with caching for mobile users

# Technology Stack

## Styling & UI

- **Tailwind CSS 4** for utility-first styling
- Custom design system with predefined color schemes for game elements
- Responsive design with mobile-first approach

## State Management & Data

- **Valtio** for reactive state management
- **SWR** for data fetching and caching
- **Immer** for immutable state updates
- Static TypeScript data files for game content

## Development Tools

- **ESLint** with Next.js, Testing Library, and Storybook plugins
- **Prettier** for code formatting (single quotes, 100 char width)
- **Husky** for git hooks with pre-commit, pre-push validation

## Testing

- **Jest** with jsdom environment
- **React Testing Library** for component testing
- **Storybook** for component development and documentation

## Build & Deployment

- **Vercel** for hosting and deployment
- **PWA** capabilities with next-pwa and service worker
- **MDX** support for documentation
- **Static-first**: Most pages use SSG via `generateStaticParams`. Use ISR only when content changes outside deploys.
  - Characters detail uses ISR (`export const revalidate = 28800`).
  - Items and special-skills are SSG (static TS data). `characters/user/*` remains dynamic.
- **Docs index generator**: `scripts/generate-doc-pages.mjs` runs in `npm run build` to produce `src/data/generated/docPages.(json|ts)`. Import the typed TS (`docPages.ts`) from runtime code; avoid `fs` in RSC.
- **Edge-safe middleware**: Supabase session update dynamically deep-imports `createServerClient` from `@supabase/ssr/dist/module/createServerClient.js` to avoid Edge runtime Node API warnings. `@supabase/ssr` is pinned to `0.7.0`.

## Supabase Integration

- **Clients**:
  - `src/lib/supabase/client.ts`: Browser client via `createBrowserClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`. Exported singleton `supabase` is used in client components/hooks.
  - `src/lib/supabase/server.ts`: RSC/Route Handler client via `createServerClient<Database>(...)` with Next `cookies()` bridge for session cookies. Use `await createClient()` inside server code.
  - `src/lib/supabase/admin.ts`: Service-role client via `@supabase/supabase-js` and `SUPABASE_SERVICE_ROLE_KEY`. For privileged server-only actions (auth admin, moderation RPCs). Never import in client code.

- **Session Middleware**:
  - `src/lib/supabase/middleware.ts#updateSession(request)`: Deep-imports `@supabase/ssr/dist/module/createServerClient.js` to keep Edge bundle Node-free. Syncs auth cookies by calling `supabase.auth.getUser()` and propagating `setAll` cookie writes to the response.
  - `src/middleware.ts`: Global middleware calling `updateSession`. Skips `api/` and static assets; also handles CORS OPTIONS and blocks specific UAs. This ensures SSR and Route Handlers have an up-to-date session.

- **Auth & User Data Flow**:
  - Client state: `src/hooks/useUser.ts` uses browser `supabase.auth.getUser()` then queries `users` table for `role,nickname`. State held in Valtio `userObject` and used across UI (e.g., `TabNavigation` for sign-out and admin links).
  - Login: `src/app/api/auth/login/route.ts` validates a custom `users` record by SHA-256 username hash and PBKDF2 password hash, looks up auth user via `supabaseAdmin.auth.admin.getUserById`, then creates a session using server client `supabase.auth.signInWithPassword()` with synthetic email `${pinyin}@${NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN}`.
  - Register: `src/app/api/auth/register/route.ts` creates `auth.users` via admin API, inserts to `public.users` with `username_hash`, `nickname`, `salt`, `password_hash`, default role `Contributor`, then signs in server-side to persist the session.
  - Logout: Client `TabNavigation` calls `supabase.auth.signOut()` and clears Valtio state.

- **Articles & Categories**:
  - Public list: `src/app/api/articles/route.ts` uses `supabaseAdmin` to fetch approved articles with joins:
    - `categories(id,name)`, `users_public_view:author_id(nickname)`, `latest_approved_version:article_versions_public_view!inner(...)` and count via `head: true` query.
    - Returns both articles and `categories` list for filters. Client `ArticlesClient.tsx` fetches via SWR (`/api/articles?limit=9999`) and performs client-side filter/sort/pagination.
  - Article detail/history/preview: Route handlers join `article_versions_public_view`, `users_public_view` and may call RPCs like `increment_article_view_count`.
  - Categories Admin: Client `src/app/admin/categories/CategoryManagementPanelClient.tsx` calls RPCs `get_categories`, `create_category`, `update_category`, `delete_category` using browser `supabase`.

- **Moderation & Admin**:
  - Role checks: Admin endpoints (`/api/auth/*`) and moderation (`/api/moderation/*`) use server client `createClient()` to read current user, then verify `users.role` (e.g., only `Coordinator` can update role/user info; Reviewer/Coordinator for moderation). Avoids exposing service key in handlers handling cookies.
  - Admin operations using `supabaseAdmin` include: `auth.admin.createUser`, `auth.admin.getUserById`, article submission/updates via RPCs `submit_article`, `update_pending_article`, `get_pending_versions_for_moderation`, `get_user_role`.

- **Database Types & Views**:
  - Types: `src/data/database.types.ts` generated types ensure typed queries on `articles`, `categories`, `users`, views `users_public_view`, `article_versions_public_view`, and functions like `get_categories`.
  - Ensure RLS policies match usage: public reads rely on views with restricted columns; writes/moderation go through SQL functions (RPCs) with server-side checks.

- **Environment Variables**:
  - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_AUTH_USER_EMAIL_DOMAIN`.
  - Optional feature gates: `NEXT_PUBLIC_DISABLE_NOPASSWD_USER_AUTH` (forces password on register/login rules).

- **Security Notes**:
  - Never import `supabaseAdmin` in client bundles. Keep service key server-only.
  - Prefer server client (`createClient()` in route handlers) for any operation touching auth cookies or requiring session context; the global middleware keeps cookies fresh.
  - Use RPCs for privileged mutations so that logic and authorization live in the database; check roles in handlers before calling RPCs.

- **Dev Checklist**:
  - Add env vars in Vercel/Local `.env.local`.
  - Verify middleware runs (auth cookie refresh) and CSP `connect-src` allows `*.supabase.co` (configured in `app/layout.tsx`).
  - Run `npm run lint` and `npm run type-check` to validate DB types usage.

## Performance & Analytics

- **Vercel Analytics** and **Speed Insights**
- Image optimization and caching strategies
- Runtime caching for offline functionality

# Project Structure

## Root Directory Organization

```
├── .github/            # GitHub Actions workflows and templates
├── .husky/             # Git hooks configuration
├── .kiro/              # Kiro AI assistant configuration
├── .storybook/         # Storybook configuration
├── public/             # Static assets (images, PWA manifest, robots.txt)
├── src/                # Source code
├── scripts/            # Build and utility scripts
└── coverage/           # Test coverage reports
```

## Source Code Structure (`src/`)

### Core Directories

- **`app/`** - Next.js App Router pages and API routes
  - `api/` - Server-side API endpoints
  - `[feature]/` - Feature-based page routing (characters, cards, etc.)
  - Layout and metadata files

- **`components/`** - Reusable React components
  - `ui/` - Basic UI components (buttons, inputs, etc.)
  - `displays/` - Complex display components
  - Root-level utility components (ErrorBoundary, Analytics, etc.)

- **`data/`** - Game data and type definitions
  - Character data files (`catCharacters.ts`, `mouseCharacters.ts`)
  - Knowledge card data (`catKnowledgeCards.ts`, `mouseKnowledgeCards.ts`)
  - `types.ts` - TypeScript type definitions
  - `__tests__/` - Data validation tests

- **`lib/`** - Utility functions and business logic
  - Feature-specific utilities (`skillUtils.ts`, `filterUtils.ts`)
  - `searchUtils/` - Search functionality
  - `__tests__/` - Unit tests for utilities

- **`context/`** - React Context providers
  - `AppContext.tsx` - Global application state
  - `EditModeContext.tsx` - Edit mode functionality
  - `DarkModeContext.tsx` - Theme management

- **`constants/`** - Application constants and configuration

## Architecture Patterns

### Data Layer

- Static TypeScript files for game data
- Centralized type definitions in `data/types.ts`
- Validation through TypeScript strict mode

### Component Architecture

- Functional components with hooks
- Context for global state management
- Utility functions separated from components
- Custom hooks in `lib/` directory
- Prefer build-time data generation over runtime `fs` in RSC. Keep pages static by default; opt into ISR only when needed.

### Feature Organization

- Feature-based routing in `app/` directory
- Shared components in `components/`
- Feature-specific utilities in `lib/`
- Data organized by game entity type

## Import Conventions

- Use `@/` path alias for `src/` directory
- Group imports: external libraries, internal modules, relative imports
- Prefer named exports over default exports for utilities

# Key Principles

- **Data Accuracy**: Precise character stats and skill descriptions are critical
- **Performance**: Fast loading and responsive design for mobile gaming scenarios
- **Accessibility**: Clean, intuitive interface that works well on mobile devices
- **Community-Driven**: Open source project welcoming contributions from the gaming community
- **Compatibility**: Ensure backward compatibility of import characters function in EditMode

# Reply Rules

## Reply style

- Be concise! Eliminate filler words.

## Comment Edit Rules

- Use meaningful variable/function names over comments
- Add comments only for: complex logic, non-obvious algorithms, or public APIs

## Command Line Syntax

- Use PowerShell syntax: `;` instead of `&&`, etc.

# Code Standards

- Follow existing patterns
- Ensure TypeScript strict mode compliance
- Write features with least net code increase
- Avoid inline scripts/styles and use build-time bundling for CSP compliance (though not required)
- Evaluate the code to ensure best practices before and after editing
- Optimize for static delivery and client-side hydration

# Things to do After Editing (important!)

- Run these commands to ensure code quality:

```Powershell
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
```

- Write a draft commit message with `feat|fix|docs|style|refactor|perf|test|chore(scope): ...` as a reference.
