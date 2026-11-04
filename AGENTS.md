# Project

- Product UI is `zh-CN` and mobile-first.
- Read private `.codex/AGENTS.md` before work when present.
- Production uses VPS/Cloudflared; Vercel is preview. Follow `DEPLOY.md` for deployment/environment setup; use the Vercel plugin for platform guidance and preview diagnostics.

# Game Data

- Public data combines the checked-in baseline with approved `game_data_actions`. Render through `getPublishedDomainReadModel` or `getPublishedEntityRouteReadModel`; static baseline lookups bypass approved edits.
- Pages combining domains share an approved-action snapshot and register consumed revisions; follow `src/app/(main)/relations/page.tsx` and `PublishedRevisionBoundary`.
- New editable types require aligned `publishableEntityTypes.ts`, published types, canonical sources, edit stores/registry, and exhaustiveness tests.
- New character roots enter through the baseline and `src/features/characters/data/characterMetadata.ts`. Supply verified actor profiles or register pending ones in `src/features/actor-profiles/pendingProfiles.ts`; pending statistics stay excluded from rankings/games. Remove pending entries when verified. Never invent canonical statistics.
- Submissions require a UUID v4 `Idempotency-Key` and atomic request RPC. After uncertain results, preserve draft/retry state; retries reuse the original endpoint, payload, and key. Reject unsupported fields, contradictory relations, new character roots, and no-net-change rows; unchanged container checks may accompany real edits. Keep `src/lib/gameData/characterDataValidation.ts` aligned with character fields.
- Character pairs share `characters.<owner>.characterRelationOverrides.<other>`, owned by the lexically smaller ID. Description, tags, and strength are shared; inverse kinds are derived. `null` removes the pair, including suggestions. Use existing pair helpers; preserve legacy reads/history. See [workflow context](docs/2026-09-30-game-data-workflow-direction.md).
- Features use typed editable-data hooks or `EditSession` draft APIs; stores, registry topology, subscribers, and browser-history helpers remain internal. Tests use `src/testUtils/editRuntime.ts` through session APIs. Shared action types/pure replay helpers remain available server-side.
- Regenerate `src/data/generated/` through its scripts. After editing `src/data/history.ts`, run `npm run generate:history-dates`.

# Database and Security

- After migration or pinned Supabase CLI changes, replay the local database, run `npm run generate:database-types`, and include generated changes in the same PR. Follow the [migration runbook](docs/operations/supabase-migrations.md), including explicit Data API grants/RLS; never hand-edit `src/data/database.generated.ts`.
- The CLI may target production. Verify the target and dry-run every remote migration push; staging uses `STAGING_DATABASE_URL` with `--db-url` for `tjwiki-test`. Preserve applied migration versions/SQL; corrections use new migrations.
- Run `scripts/ops/measure-admin-game-data-actions.sql` exclusively against `tjwiki-test` via `STAGING_DATABASE_URL`.
- Keep elevated clients/keys server-only. Preserve permissions, rate limits, validation, RLS/RPC boundaries, password hashing, and rich-text/URL sanitization. Choose optional/required Supabase helpers deliberately; preserve graceful behavior when credentials are absent, articles disabled, or CAPTCHA secrets absent.
- Public mutations invalidate corresponding cache tags, including sitemap/aggregate tags where applicable.

# UI and Runtime

- Before adding UI, search `src/components/` and the feature; read candidate props and one caller, then reuse/compose when suitable.
- Use `@/components/Link` and `@/hooks/useNavigation` for offline/progress/edit-parameter behavior; `@/components/Image` for generated formats; `BaseDialog` for dialogs. Preserve dark mode, keyboard/touch access, visible focus, semantics/ARIA, and reduced motion.
- Preserve route cache contracts and deliberate React Compiler directives.
- Define application variables in `src/env.ts`, mirror public variables in `experimental__runtimeEnv`, and synchronize `.env.example`/deployment docs. Script/deployment-only variables follow their owning tool. Keep environment/build validation enabled by default.
- Generate `public/sw.js` from `src/sw.ts` via `serwist.config.mjs`. Exclude editing/admin workflows from offline caching; follow [offline browsing](docs/operations/offline-browsing.md) for navigation/cache changes.
- Before reading Chinese in PowerShell, set console input/output and `$OutputEncoding` to UTF-8; use `rg` or `Get-Content -Encoding UTF8`. Check display encoding before rewriting apparent mojibake.

# Validation

- Source: `npm run lint`, `npm run type-check`, and relevant tests. Broad/cross-cutting changes require full `npm test`.
- Scripts/script-test configuration: `npm run test:scripts`; keep `.test.mjs` outside Jest wrappers.
- Styling: also `npm run check:tailwind`; check both themes after color changes. Actor profiles: also `npm run validate:actor-profiles`.
- Markdown-only: `npx prettier --write <changed-file>` and check formatting; source tests are unnecessary.
- Build when validation depends on bundling, static generation, build pipelines, or service-worker output; otherwise prefer focused checks. Use `npm run build:skip-images`, or `npm run build` when validating image optimization, to preserve the game-data build snapshot workflow.
