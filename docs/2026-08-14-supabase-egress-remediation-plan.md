# Supabase Egress Remediation Plan

**Status:** In progress
**Created:** 2026-08-14
**Last updated:** 2026-08-21
**Billing cycle under investigation:** 2026-08-07 through 2026-09-07
**Fair Use grace-period end:** 2026-09-13

## Problem statement

The Supabase organization exceeded the Free-plan uncached-egress quota. On 2026-08-14 the
organization usage page reported:

| Usage item           | Observed usage | Free-plan quota | Assessment |
| -------------------- | -------------: | --------------: | ---------- |
| Uncached egress      |       7.292 GB |            5 GB | Exceeded   |
| Cached egress        |       0.357 GB |            5 GB | Healthy    |
| Database size        |       0.062 GB |          0.5 GB | Healthy    |
| Storage size         |       0.037 GB |            1 GB | Healthy    |
| Monthly active users |             40 |          50,000 | Healthy    |

At the observed rate of approximately 1 GB of uncached egress per day, a full billing cycle would
exceed 30 GB. Staying below 5 GB requires an approximate 84% reduction from that run rate. Usage
already recorded in the current cycle cannot be reduced retroactively, so this plan targets future
egress and the next complete billing cycle.

This is not primarily a Storage or user-growth problem. The production database contains only a
small amount of application data, and cached Storage egress is well below its independent quota.
The dominant issue is repeated transmission of wide `game_data_actions` JSON result sets during
static generation and page rendering.

## Evidence collected

The following observations were collected read-only from the Supabase project, the organization
usage dashboard, the Vercel project, and the current source tree.

### Database query evidence

The retained `pg_stat_statements` window began at `2026-08-09 03:30:03 UTC`.

| Query shape                                |             Calls | Approximate result size per call | Relevant source                                                                        |
| ------------------------------------------ | ----------------: | -------------------------------: | -------------------------------------------------------------------------------------- |
| Character game-data contribution authors   |             5,671 |                        2,311 KiB | `src/lib/gameData/contentWriters.ts`                                                   |
| Complete approved public-action snapshot   |             3,763 |                        1,197 KiB | `src/lib/gameData/publicActionQueries.ts` and `published/getApprovedActionSnapshot.ts` |
| Current-user permission-grant RPC          |            40,053 |                            small | `src/lib/auth/requirePermission.ts`                                                    |
| Supabase Auth user/session support queries | about 50,000 each |                            small | Root session and user-context reads                                                    |

The result sizes are PostgreSQL JSON-size estimates before HTTP compression and protocol overhead.
They must not be multiplied by call count and presented as exact billed bytes. They are sufficient
to rank the query shapes and demonstrate that the two bulk game-data reads can account for the
observed egress.

The action table contained:

| Status   | Public |  Rows | Stored `entry` bytes |
| -------- | ------ | ----: | -------------------: |
| Approved | Yes    |   595 |              532 KiB |
| Synced   | No     | 1,288 |              939 KiB |
| Rejected | No     |   707 |              579 KiB |
| Pending  | No     |    11 |          3,108 bytes |
| Revoked  | No     |     6 |          2,519 bytes |

### 2026-08-21 baseline refresh

After the verified 27-action baseline compaction and production cutover, a read-only production
count recorded 675 approved public rows, 1,373 synced rows, 9 private pending rows, 715 rejected rows,
and 6 revoked rows. The compaction is an already completed exception to Phase 5's original ordering,
not evidence that further compaction should precede the primary call-amplification fix. Refresh query
counts and payload bytes again when Phases 1 through 3 enter their deployment gate.

The character-author query loads 1,672 approved-or-synced character rows on every cache miss. It
accepts a `characterId`, but the SQL query cannot use that value because the target character is
encoded inside each action's `entry` paths. The function therefore downloads all candidate rows,
parses them in application code, and only then selects the requested character.

### Build-amplification evidence

From `2026-08-09 03:46 UTC` through `2026-08-13 14:21 UTC`, Vercel recorded 27 deployment attempts:

- 19 reached `READY`;
- 6 were canceled; and
- 2 were blocked.

The number and timing of deployments strongly correlate with the bulk-query counts. Static detail
routes call `getApprovedActionSnapshot()`, and every character route also calls
`getContentWritersForCharacter()`. Next build workers do not provide a reliable deployment-wide
single-flight guarantee for these reads, even though the application uses `unstable_cache`.
Deployment-specific cache identity also intentionally prevents reuse between separate artifacts.

### Endpoint and Storage evidence

- `GET /api/game-data-actions/public/` returned 1,010,642 bytes during a direct production check.
- The response was `cf-cache-status: DYNAMIC` and had no explicit shared-cache policy.
- The current source tree no longer calls this endpoint from the main client path, but older clients
  or installed service workers may still request it.
- Supabase Storage contained 71 article images totaling approximately 42 MB. Cached egress was only
  0.357 GB, so Storage migration or image removal is not an urgent response to this incident.

## Goals

- Keep uncached Supabase egress below 5 GB per complete billing cycle, with a working target below
  150 MB per day averaged over seven days.
- Reduce each identified bulk query shape by at least 95% before considering a plan upgrade.
- Make each stable Supabase-enabled build attempt perform exactly one approved-snapshot bulk fetch and
  one contributor-source bulk fetch. A deliberately disabled attempt performs zero database fetches.
- Make character-contributor aggregation perform at most one bulk fetch per process/cache population
  or enabled build attempt, not one bulk fetch per character.
- Preserve published game-data output, contributor attribution, action history, auth behavior,
  permissions, static-generation coverage, cache-tag invalidation, and safe behavior when Supabase is
  disabled or unavailable.
- Add regression checks so a future page or build cannot silently restore per-route bulk fetching.

## Safety invariants

These constraints apply to every phase:

- Do not complete an approved action's `synced` status cutover until its effect is present in the
  release being activated and before/after published output has been proven equivalent.
- Any future compaction design must prevent both double replay and concurrent approved-set changes
  during its deployment/status cutover.
- Do not weaken RLS, permission checks, trusted RPC boundaries, or `server-only` imports to save
  bandwidth.
- Do not use the Supabase admin client in client code or serialize secret credentials into build
  artifacts.
- Preserve ordered action replay by `created_at ASC, id ASC` wherever replay semantics depend on it.
- Preserve the existing disabled/missing-credentials fallback.
- Make artifact-backed static reads register `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG`, just as runtime
  Supabase reads do, so later publication or moderation still invalidates prerendered routes.
- The build generator must work with the production-supported publishable-key-only configuration. It
  must not require or opportunistically use the Supabase secret/service-role key. Any public
  `SECURITY DEFINER` read used to make that possible must expose only the minimum public or derived
  fields required by the build, revoke the default `PUBLIC` grant, use a fixed safe `search_path`, and
  have explicit permission and payload-shape tests.
- Keep raw synced action rows outside anonymous table and RPC access. Synced actions remain eligible
  for derived public contributor attribution, but the public contributor RPC must return only the
  final character/contributor projection and never return action `entry` payloads or action IDs.
- The approved replay epoch protects only the public replay source. Contributor nicknames and other
  attribution-only inputs are eventually consistent, are not part of the replay-epoch fence, and have
  no fixed freshness guarantee.
- During a static build, only the pre-build generator may query the two source boundaries. When the
  explicit build-artifact variable is present, the shared server-side Supabase fetch transport used by
  every application server client must reject direct `game_data_actions` requests and
  contributor-source RPC calls before any network request or retry.
- Keep build artifacts free of user emails, IP addresses, tokens, or other private auth data.
- Run production action-table mutations only through existing trusted application/RPC paths.
- Use `tjwiki-test` for database-changing validation. Do not run the admin action measurement SQL
  against production.

## Shared implementation boundary

Phases 1 through 3 have separate success criteria but intentionally share one implementation: one
build wrapper, one versioned build-data artifact, one deployment identity, one unique artifact path
per attempt, one cleanup path, and one final summary. Implement and deploy them together unless a
smaller change can reuse that same boundary; do not create separate contributor and approved-action
artifact systems merely to preserve phase independence.

The preview-containment prerequisite and Phase 4 remain independently deployable. Phases 5 through 7
are decision gates, not part of the initial incident implementation. If their measurements justify
further work, create a separate reviewed design rather than expanding this remediation in place.

## Operational tradeoffs and limitations

- Approval or moderation changes only during the epoch-protected build window can trigger a retry;
  continuous changes may exhaust three attempts and fail that deployment. Serving deployments remain
  available and refresh through normal cache-tag invalidation.
- A drifted deployment can take up to three Next.js build attempts and three bulk fetches per source,
  while each individual attempt remains within its one-fetch budget.
- The replay epoch does not version contributor nicknames or synced-only attribution changes. A build
  may therefore publish contributor attribution that is stale, including for longer than one hour in
  a long-lived preview or cache population; this accepted staleness does not affect game-data replay.
- Artifact, credential, checksum, or epoch failures stop the candidate build instead of falling back to
  repeated Supabase reads.
- Supabase-disabled previews save all database egress but cannot fully test auth, articles, or other
  dynamic Supabase features.
- Preserving a VPS last-known-good release requires temporary disk space and cleanup, and may still
  involve brief planned downtime; the requirement guarantees recovery, not zero-downtime activation.
- The public epoch and contributor-source RPCs are small security-sensitive migrations and must retain
  their exact grants, minimal return shapes, and hardened definitions. The contributor RPC exposes only
  derived attribution rows, not its raw synced-action inputs. The final replay-epoch check runs after
  all build post-processing. A small unavoidable window remains between the build command returning
  and deployment activation.

## Prerequisite — Contain preview-build amplification

This is an operational gate, not a numbered implementation phase. Activate it before beginning
Supabase-enabled implementation or validation builds for Phases 1 through 3, and keep it active until
those phases are deployed and their build-fetch budgets are verified. It does not change the shared
implementation boundary or create a partial-deployment option for Phases 1 through 3.

### Independent problem

Every preview deployment can regenerate hundreds of static routes while connected to Supabase. A
rapid sequence of pushes, dependency branches, canceled builds, or superseded builds can consume a
material part of the monthly quota before a code fix reaches production.

### Actions

- [ ] Temporarily batch commits before pushing branches that trigger Vercel previews.
- [ ] Cancel superseded preview builds as soon as a replacement is queued.
- [x] Review the Vercel Git deployment policy and avoid building automated dependency branches that
      do not require a live application preview.
- [x] Choose one temporary containment mode until Phases 2 and 3 are deployed:
  - pause automatic previews; or
  - set `NEXT_PUBLIC_DISABLE_ARTICLES=1` only in the Vercel Preview environment, accepting that auth,
    articles, and other Supabase-backed preview features will be unavailable; or
  - keep one designated integration preview connected to Supabase and make other branch previews
    baseline-only or prevent them from building.
- [ ] Record the selected mode and the date it was enabled. The configuration was staged on
      2026-08-21: only the `develop` integration branch may auto-deploy to Vercel; all other Git
      branches are prevented from building by `vercel.json`. Record its activation after deployment.
- [x] Do not change VPS production environment variables as part of this containment phase.

### Validation

- [ ] Push one documentation-only test commit if a preview-policy check is necessary.
- [ ] Confirm that ignored or Supabase-disabled previews no longer produce the two bulk query shapes.
- [ ] Confirm that `dev.tjwiki.com` retains the intended feature level for the selected containment
      mode.

### Success criteria

- No unneeded Supabase-enabled preview is built while the remediation is in progress.
- Daily bulk-query call growth falls immediately, without changing production behavior.

### Rollback

Restore the previous Vercel preview policy or environment value. This phase does not mutate
application data and is fully reversible.

## Phase 1 — Add one shared build-data prepass and lean observability

**2026-08-21 foundation checkpoint:** The inactive shared artifact envelope, atomic file helpers,
tagged server reader, privacy-safe summary/budget projection, build-source transport guard, and
server-client constructor allowlist are implemented with focused tests. Build commands and selectors
remain unchanged, so this checkpoint is not independently deployable and does not yet reduce egress.
Phase 2 and Phase 3 must supply and validate both payloads before the wrapper is activated.

### Independent problem

The current build lets static workers reach bulk data sources independently and does not report how
many database reads were performed. That permits both the current amplification and silent
regression.

### Design

Make one pre-build generator the only component allowed to perform the two bulk database reads during
a static build. It writes one atomic, deployment-identity-bound artifact under a unique
attempt-specific `.tmp/` path; all Next workers read that artifact and must fail rather than query
Supabase when it is unavailable or invalid.

Enforce that ownership at the existing shared server-side Supabase fetch seam, currently
`src/lib/supabase/fetch-retry.ts`, as well as within the selectors. Every application server client
constructor—publishable, admin, cookie-aware Server Component, route-handler, and proxy—must inject
that transport. When the artifact-path variable is present, the transport parses the request URL and
rejects the `game_data_actions` REST path and
`read_game_data_character_contributor_source()` RPC path before the request reaches the network or
retry loop. Browser clients are outside this build-worker contract.

The generator constructs its own acquisition client before the wrapper passes the artifact-path
variable exclusively to `next build`. Do not create or transfer a capability token: process and
environment separation are sufficient. The transport guard, not the generator summary, is the
authoritative prohibition against direct or future worker queries.

Expose the artifact through one server-only, module-scoped cached reader tagged with
`PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG`. Both the approved-snapshot and contributor selectors must use
that boundary during a build instead of reading the file directly. This preserves the cache-tag
dependency of `force-static` route output even though the cache callback reads a local artifact rather
than Supabase. After deployment, invalidation removes that dependency and the next runtime render uses
the existing tagged Supabase path because the build-artifact variable is absent.

Because the generator owns the database calls, it can emit one summary directly after generation.
Do not build a per-worker metrics-fragment or reducer subsystem. The summary contains only query-shape
names, fetch counts, row counts, approximate serialized bytes, durations, and artifact checksums. It
must never contain action contents, user identifiers, credentials, or URLs containing keys.

### Actions

- [ ] Add one build wrapper and shared build-data generator under `scripts/`.
- [ ] Have the wrapper choose one `DEPLOY_BUILD_ID` when absent and pass the same value to the
      generator and `next build`.
- [ ] Write one versioned artifact atomically under an attempt-specific `.tmp/` path and remove it in a
      `finally` path. Overlapping local builds and drift retries must not share paths.
- [ ] Pass the explicit artifact path to `next build`; do not expose it to normal runtime or ISR.
- [ ] Add one module-scoped, server-only artifact reader tagged with
      `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG`; selectors must not bypass it with raw filesystem reads.
      Pass the unique artifact path as an explicit cached-function argument so Next's preserved
      `.next/cache/fetch-cache` cannot reuse a rejected attempt's value.
- [ ] Emit one generator summary containing each source's fetch count, rows, bytes, duration, and
      payload checksum, plus the attempt number. Report lightweight epoch-validation calls separately
      from bulk fetches.
- [ ] Enforce mode- and attempt-specific budgets: exactly one fetch for each bulk source in a stable
      Supabase-enabled attempt, zero database fetches in a deliberately disabled attempt, and never
      more than one fetch per bulk source within any attempt. A bounded drift retry starts a new,
      separately logged attempt and does not relax its per-attempt budget.
- [x] Add the build-mode source-query guard to the shared server-side Supabase fetch transport. With
      the artifact variable present, parse the URL and reject the `game_data_actions` REST path and
      contributor-source RPC path with a typed error before invoking the underlying fetch or retry
      loop. Do not block unrelated Supabase requests required during a build.
- [x] Inject the guarded transport into every application server-side Supabase constructor, including
      publishable, admin, cookie-aware Server Component, route-handler, and proxy clients. The
      generator uses a separately constructed acquisition client before the wrapper passes the
      artifact variable only to `next build`; no transferable authorization token is needed.
- [x] Add an architecture check that server-side Supabase constructors remain confined to an explicit
      allowlist, every allowed application constructor injects the guarded transport, and
      build-reachable readers cannot issue raw PostgREST/RPC requests around that seam.
- [ ] Make CI fail if the applicable budget is exceeded or the build-mode guard records any worker
      source-query attempt. Keep the summary as observability; do not treat it as proof that workers
      made no queries.
- [ ] Update `build`, `build:debug`, and `build:skip-images` to use the wrapper without changing their
      validation, docs generation, Serwist, or image-optimization contracts.
- [ ] Document how to compare Vercel build summaries with retained `pg_stat_statements` deltas.

### Tests

- [x] Unit-test summary calculation and prove that action contents, IDs, user IDs, and credentials
      cannot appear in it.
- [ ] Unit-test the generator with mocked sources: assert exactly one invocation of each bulk query in
      enabled mode, zero in disabled mode, and the same per-attempt limit across a drift retry.
- [ ] Add a build contract proving worker readers use only the artifact and cannot fall back to
      Supabase. Cover canonical helpers, direct `.from('game_data_actions')` calls, the contributor RPC,
      publishable, admin, cookie-aware server, route-handler, and proxy clients, plus the
      unguarded-client architecture check. Assert rejection occurs before the underlying fetch and
      produces no retry.
- [ ] Prove an artifact-backed `force-static` route records
      `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and is regenerated after that tag is invalidated.
- [ ] Test atomic replacement, deployment-identity isolation, generator failure, and cleanup. Seed a
      prior artifact path's Next fetch-cache entry and prove a retry with a new path cannot reuse it.

### Success criteria

- Every build attempt ends with one concise game-data read summary.
- Static workers perform zero source database queries; the generator is the only authorized source
  reader.
- CI detects any increase above one generator fetch per bulk source per enabled attempt and any
  database fetch in deliberately disabled mode, and fails on every guarded worker attempt.

### Rollback

Restore the previous npm build commands and direct readers. Delete temporary artifacts. No database
state is changed.

## Phase 2 — Build one global character-contributor index

### Independent problem

`queryGameDataActionAuthors(characterId)` downloads every approved or synced character action even
though the caller needs contributors for only one character. The result is cached under a key that
contains `characterId`, so the same multi-megabyte source data is downloaded and parsed again for
each character.

This is the highest-value low-risk code fix because contributor attribution is derived data: it can
be aggregated once and indexed by character without changing its public meaning.

### Proposed design

Replace the per-character bulk query with two data layers and an explicit acquisition layer:

1. `read_game_data_character_contributor_source()` is a narrowly scoped public
   `SECURITY DEFINER` RPC that reads public or synced character actions internally and returns one JSON
   object containing `sourceActionCount`, `rowCount`, and an ordered `rows` array. Each row is already a
   derived public attribution record: character ID, contributor ID, trimmed public nickname, and
   contribution count. It never returns action IDs or `entry` payloads. Returning one JSON object
   avoids PostgREST's row cap without making the RLS-hidden synced source rows public.
2. `buildCharacterContributorIndex(rows)` validates and indexes the derived rows once and returns a
   plain, cache-serializable record keyed by character ID.
3. `getCharacterContributorIndex()` selects the correct source for the current context. Static builds
   read the contributor payload from the shared build-data artifact created in Phase 1; normal runtime
   uses one globally tagged cache entry and a process-local in-flight promise so concurrent cold
   requests share the same source query.

The cached value should resemble:

```ts
type CharacterContributorIndex = Record<
  string,
  Array<{ id: string; name: string; contributionCount: number }>
>;
```

Use arrays and plain objects rather than `Map` or `Set` in the cached boundary. The public
`getContentWritersForCharacter(characterId)` function then reads one index entry and performs the
existing static-author deduplication and final `ContentEditor` mapping.

A global `unstable_cache` key alone is not a single-flight mechanism: concurrent cold misses can all
enter the callback before the first result is stored. The shared build artifact is therefore
authoritative during static generation. The runtime in-flight promise deduplicates only concurrent
acquisition; it must be cleared after settlement so tag invalidation and the existing cache/route
revalidation behavior remain effective. Nickname-only changes are allowed to remain stale beyond one
hour and do not require a dedicated epoch, tag invalidation, or freshness SLA.

### Actions

- [x] Extract a pure `buildCharacterContributorIndex()` function.
- [x] Add `read_game_data_character_contributor_source()` in a forward Supabase migration. Make it a
      no-argument `SECURITY DEFINER` function owned by the migration owner with a fixed safe
      `search_path`; revoke the default `PUBLIC` grant and grant execution explicitly to `anon` and
      `authenticated`.
- [x] Return one JSON object rather than a set of rows. Include `sourceActionCount`, `rowCount`, and a
      deterministically ordered `rows` array, and validate that `rowCount === rows.length`. For
      `entity_type = 'characters'` actions satisfying `is_public = true OR status = 'synced'`, expose
      only derived `{ characterId, contributorId, nickname, contributionCount }` rows. Do not expose
      action IDs, `entry`, messages, status, timestamps, review metadata, private user fields, or
      unrelated action types.
- [x] Normalize supported stored-entry shapes and extract distinct character IDs inside the protected
      database implementation. Count at most one contribution per source action and character, then
      aggregate by character and contributor. Keep any internal helper ungranted and verify its output
      against the existing TypeScript normalization behavior before removing the legacy path.
- [ ] Replace the misleading per-character database function with a publishable-client reader for this
      RPC. The build generator and normal runtime must not select the admin client for this source.
- [x] Validate the derived payload in TypeScript and convert it to `CharacterContributorIndex` without
      receiving or reparsing raw action entries.
- [x] Preserve author ordering by contribution count descending and nickname ascending.
- [x] Preserve deduplication against checked-in content writers and contributor IDs.
- [x] Cache the complete plain-object index under one global runtime key, without `characterId`, and
      define the cached wrapper once at module scope.
- [x] Wrap the runtime cache-miss callback in a process-local in-flight promise so simultaneous cold
      misses share one query without retaining a resolved value beyond the cache population attempt.
- [ ] Extend the shared generator with one contributor-index payload built from exactly one contributor
      RPC call per attempt. Store only derived public `{ id, name, contributionCount }` entries, source
      action count, character count, and checksum. Do not claim that the replay epoch versions this
      payload.
- [x] Add a server-only contributor reader for the shared artifact. Build workers must fail on a
      missing, invalid, or deployment-identity-mismatched payload and never fall back to Supabase. It
      must select its payload through the shared tagged artifact reader, not read the file directly.
- [x] Keep the existing `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and current configured revalidation so
      publication, approval, revocation, and mark-synced flows invalidate attribution. Treat timed
      revalidation as an implementation detail rather than a nickname-freshness guarantee; previews
      may retain attribution for their lifetime.
- [x] Ensure malformed or unsupported action entries are handled consistently with existing replay
      normalization.
- [x] Keep `getContentWritersForCharacter()`'s public return type unchanged.

### Tests

- [ ] Snapshot current outputs for characters with static authors, dynamic editors, duplicate names,
      and multiple contributions.
- [x] Start multiple character lookups concurrently with `Promise.all` against an empty runtime cache
      and assert one source query, including the error-and-retry path after the shared promise rejects.
- [ ] Test that multiple simulated build-worker readers use the shared artifact generated by one
      contributor query and that no reader can fall back to Supabase.
- [ ] Prove contributor-backed character pages retain the public-actions cache-tag dependency and are
      regenerated after publication invalidation.
- [x] Test an action touching multiple characters.
- [x] Test multiple entry fragments touching the same character.
- [x] Test public approved, public pending, and synced actions; reject private pending, rejected, and
      revoked rows.
- [x] Test null creators, missing public profiles, blank nicknames, and malformed entries.
- [x] Test the contributor RPC grants and exact JSON shape. Prove an anonymous caller receives only
      derived character/contributor attribution and cannot recover action IDs, action `entry` values,
      unrelated action types, private user fields, or the underlying epoch table.
- [x] Compare the RPC projection with the legacy TypeScript aggregator across all supported entry
      shapes, duplicate character paths, multiple characters, malformed entries, and contributor
      ordering.
- [x] Test a source larger than the configured PostgREST `max_rows` value and prove the single JSON
      result remains complete; also fail clearly if the RPC returns a malformed or incomplete payload.
- [x] Test deterministic ordering independent of input-row order where ordering is not semantically
      meaningful.
- [x] Run relevant Jest tests, `npm run lint`, and `npm run type-check`.
- [ ] Run `npm run build:skip-images` with Supabase pointed to `tjwiki-test` when practical.

Local implementation checkpoint (2026-08-21): the derived RPC, generated types, global runtime index,
artifact reader, writer integration, and focused Jest/pgTAP coverage are complete. Generator integration,
multi-worker artifact verification, invalidation regeneration, current-output snapshots, and the build and
deployment gates remain open. This checkpoint is not independently deployable; complete the shared
generator and wrapper work in Phase 3 before activation.

### Deployment gate

- [ ] Compare every generated character page's writer/editor output before and after the change.
- [ ] Confirm a stable enabled multi-route build attempt reports exactly one contributor-source
      database fetch, not one per worker or character, and a disabled attempt reports zero.
- [ ] Confirm publication invalidation causes concurrent next lookups to rebuild the runtime index
      with one source query.
- [ ] Change a nickname without changing the replay epoch and confirm the build remains valid. Record
      that the old attribution may remain visible until a later natural cache/route refresh, with no
      fixed one-hour guarantee.

### Success criteria

- Reduce the character-contributor source query by at least 95% under an equivalent build workload.
- Perform exactly one character-contributor source database fetch per stable enabled build attempt and
  zero in disabled mode, independent of route concurrency and worker count.
- Preserve byte-for-byte-equivalent serialized contributor/editor props for all existing characters,
  excluding irrelevant object-key ordering.
- The anonymous contributor RPC returns only the compact derived attribution projection and exposes no
  raw action row or payload.
- Add only the scoped read-only contributor RPC migration and no new production write path.

### Rollback

Restore the per-character implementation. Revoke and remove the contributor-source RPC in a forward
rollback migration after all callers are reverted. Because this phase changes only derived reads and
caches, rollback requires no data repair.

## Phase 3 — Generate one approved-action snapshot per build attempt

### Independent problem

Static detail routes independently reach `getApprovedActionSnapshot()`. `unstable_cache` and React
request caching do not guarantee one database fetch across all Next build workers. A single preview
can therefore download the same approximately 1.2 MB approved-action set hundreds of times.

### Proposed design

Extend the shared Phase 1 generator with an approved-action payload fetched and validated exactly
once. Every static-generation worker reads that payload from the same local artifact. Normal runtime
and ISR continue to use the current tagged Supabase cache so newly published actions remain visible
after invalidation.

The prepass must acquire both bulk sources exactly once using only the publishable-key configuration
supported by production, but only the replay payload is epoch-protected. It performs the derived
contributor-source RPC, reads the lightweight replay epoch, performs the existing canonical
approved-action query, and reads the epoch again. It accepts the approved payload only when both
non-null epochs match. The contributor projection is independently validated but is allowed to be
stale because nickname and synced-only attribution changes do not affect replay correctness. The
approved query requests an exact count in the same HTTP call and rejects any result whose returned row
count does not equal that count, so a PostgREST row limit cannot silently truncate the replay snapshot.

After `next build`, Serwist generation, and any configured image optimization finish, but before the
build command accepts the output, the wrapper reads the epoch once more. If any check differs, the
wrapper discards that attempt and reruns the entire prepass and output-producing build pipeline, with a
fresh artifact path, up to three total attempts. This optimistic fence protects the replay source
without adding a public approved-snapshot endpoint or turning a routine race into an immediate outage.
Each retry also refreshes the contributor projection, but contributor changes alone do not trigger a
retry.

The shared artifact should contain only the public and derived fields required by its two readers:

```ts
type BuildGameDataArtifact = {
  schemaVersion: 1;
  deploymentIdentity: string;
  fetchedAt: string;
  approvedActions: {
    replayEpoch: number | null;
    rowCount: number;
    checksum: string;
    rows: PublicActionRow[];
  };
  contributors: {
    sourceActionCount: number;
    characterCount: number;
    checksum: string;
    index: CharacterContributorIndex;
  };
};
```

Store it under the ignored `.tmp/` directory. Do not place dynamic production rows in tracked
`src/data/generated/` files, and do not commit the artifact.

### Credential and read contract

The generator has two explicit modes:

| Mode                  | Credentials              | Bulk reads per attempt      | Replay epoch validation                        |
| --------------------- | ------------------------ | --------------------------- | ---------------------------------------------- |
| Deliberately disabled | None                     | Zero                        | None                                           |
| Supabase enabled      | URL plus publishable key | Exactly one per bulk source | Approved-action source only; checks are logged |

Add a narrowly scoped public epoch RPC for the prepass and post-build guard.
Grant execution to `anon` and `authenticated` after revoking the default `PUBLIC` grant. Because the
epoch table itself remains service-role-only, make this a no-argument `SECURITY DEFINER` function
owned by the migration owner, with a fixed safe `search_path` and an exact scalar query. It returns one
epoch and exposes no action or profile fields. Phase 2 adds the separate hardened contributor-source
RPC because anonymous table RLS intentionally hides synced rows. That RPC may read the raw rows under
its definer rights but returns only the derived character/contributor projection. Keep the existing
canonical public table query for approved rows; do not add a public approved-snapshot endpoint. The
generator always uses the publishable client even if a secret key happens to exist in the environment.
Controlled previews use `tjwiki-test` publishable credentials; arbitrary preview branches do not
receive production secrets.

### Actions

- [ ] Extend the shared build-data generator and artifact schema with the approved-action payload.
- [ ] Keep the wrapper's `DEPLOY_BUILD_ID`, `next.config.ts` build ID, embedded
      `TJWIKI_BUILD_IDENTITY`, and artifact deployment identity identical.
- [ ] Reuse the canonical ordered query and validation logic; do not create a second interpretation
      of public-row eligibility.
- [ ] Add the narrowly scoped public epoch-only RPC described above, including explicit grants, fixed
      `search_path`, generated database types, and permission tests.
- [ ] Add a publishable-client prepass that performs the contributor-source RPC, epoch-before, the
      existing canonical approved-action query, and epoch-after in that order. Accept the approved
      payload only when both epochs are equal and non-null; validate the contributor payload separately
      without assigning it a replay epoch. Do not call the current admin-only snapshot reader or require
      `SUPABASE_SECRET_KEY`; only the deliberately disabled empty artifact may use a `null` epoch.
- [ ] Request an exact approved-row count in the same query call and reject a count mismatch rather
      than accepting a PostgREST-truncated result. Validate row shape, ordering, duplicate IDs,
      supported entity types, and replay decodability.
- [ ] Calculate the approved payload checksum over a canonical serialization of the ordered rows,
      excluding volatile metadata such as `fetchedAt`.
- [ ] Wrap the complete prepass, `next build`, Serwist generation, and configured image optimization
      in at most three attempts. Run the final epoch guard after those output-producing steps. On an
      epoch mismatch, delete that attempt's output and artifact, choose a new artifact path, then
      regenerate the pipeline from scratch. Do not retry unrelated deterministic failures. If the epoch
      is unreadable or all drift attempts are exhausted, fail clearly and never deploy the candidate.
      Epoch checks are not bulk fetches.
- [ ] Add a server-only selector used by `getApprovedActionSnapshot()` only when the explicit
      build-artifact environment variable is present. It must consume the shared tagged artifact
      reader so `force-static` pages retain `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` invalidation.
- [ ] Reject a missing, unreadable, stale-deployment-identity, checksum-invalid, or
      schema-version-invalid artifact instead of silently issuing hundreds of fallback database
      queries during a build.
- [ ] When Supabase is deliberately disabled, generate a valid empty artifact and preserve the
      checked-in baseline behavior.
- [ ] Keep normal runtime behavior on VPS and Vercel ISR unchanged: no build variable means the
      existing tagged Supabase cache is used.
- [ ] Ensure neither publishable nor secret keys are written to the shared artifact or logs.
- [ ] Before enabling this wrapper on the VPS, update `scripts/ops/deploy_server.sh` so a failed or
      exhausted candidate build cannot leave production stopped. Preserve a verified last-known-good
      release (source revision and build output), restore it on failure, and restart PM2. A small
      candidate-release or backup/restore mechanism is sufficient; a general release platform is not
      required.

### Tests

- [ ] Unit-test artifact validation, checksum verification, schema-version rejection, and deployment-ID
      mismatch handling.
- [ ] Test the disabled-Supabase empty artifact.
- [ ] Test a production-equivalent publishable-key-only build with `SUPABASE_SECRET_KEY` absent, and
      assert the generator never selects the admin client when a secret is present.
- [ ] Test the epoch RPC grants and scalar return shape, including that it exposes no action, profile,
      or other private fields. Test the contributor-source RPC grants and minimal JSON payload in the
      Phase 2 suite.
- [ ] Test that multiple simulated approved-action readers use one shared artifact generated by one
      approved-action database fetch.
- [ ] Simulate a replay-set change during approved-source acquisition, `next build`, and post-build
      processing. Prove every case retries from a fresh artifact path and succeeds when the next
      attempt is stable. Test that a seeded prior-path fetch-cache value cannot be reused, repeated
      drift stops after three attempts, and the unchanged-epoch path uses one attempt.
- [ ] Simulate nickname and synced-only attribution changes without a replay-epoch change. Prove they
      do not trigger a retry or invalidate an otherwise valid build, and document that the accepted
      artifact may contain stale attribution.
- [ ] Test that runtime without the build variable still calls the tagged Supabase reader.
- [ ] Test an actual artifact-backed `force-static` route: invalidate
      `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG`, trigger revalidation, and prove it reads fresh runtime data.
- [ ] Exercise the VPS failure path and prove the last-known-good release is restored and PM2 is
      running after a candidate build fails or exhausts its drift retries.
- [ ] Compare approved snapshot revision, rows, route read models, and history selectors between the
      artifact and database paths.
- [ ] Run published-game-data selector suites, route contract tests, lint, type-check, and
      `npm run build:skip-images`.

### Deployment gate

- [ ] Run one Vercel preview against `tjwiki-test` using only its publishable credentials, plus one
      deliberately disabled preview/build contract with no Supabase credentials.
- [ ] Require a stable enabled attempt to show exactly one `build-snapshot-database-fetch`, a disabled
      attempt to show zero, and every retry to have its own bounded attempt summary.
- [ ] Exercise the staging replay epoch during a controlled build and confirm replay drift during
      approved-source acquisition, `next build`, or post-processing retries cleanly while repeated
      drift prevents that deployment from reaching `READY`.
- [ ] Compare a representative set of character, card, map, mode, recommended, and special-skill
      pages with the preceding preview.
- [ ] Verify a post-build publish still invalidates runtime data and appears after ISR/revalidation.

### Success criteria

- Exactly one approved-action bulk fetch per stable enabled build attempt, zero in disabled mode, and
  never more than one within any attempt, independent of static route count or worker count.
- No build output is accepted when the approved replay epoch changes between the approved-source
  prepass guard and the end of all build post-processing.
- Artifact-backed static routes remain attached to `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and refresh
  from the runtime reader after invalidation.
- Production-equivalent builds succeed without a Supabase secret. The new public RPCs expose only the
  replay epoch and the derived character/contributor projection; no public RPC exposes raw synced
  action rows, the approved replay snapshot, or private profile fields.
- Drift retries are bounded, and a failed VPS candidate automatically restores a running
  last-known-good release.
- No production output difference for an identical action snapshot.
- A broken prepass fails the build clearly instead of falling back to per-page Supabase reads.

### Rollback

Restore direct `getApprovedActionSnapshot()` reads and remove the approved-action payload while
retaining the shared wrapper for the contributor payload. If all shared-artifact phases are reverted,
restore the previous npm build commands as well. Revoke and remove the epoch RPC in a forward rollback
migration if it is no longer used; no production data rows require repair.

## Phase 4 — Bound or retire the legacy public-actions HTTP endpoint

### Independent problem

`/api/game-data-actions/public/` returns an approximately 1 MB response without a shared HTTP cache
policy. The current application no longer references it directly, but the service worker still
classifies it as a cacheable public endpoint and older installed clients may continue requesting it.

### Measurement-first decision

- [ ] Add a privacy-safe request counter or inspect existing edge/runtime logs for this exact path.
- [ ] Separate requests from current builds, current clients, old service workers, health checks, and
      bots where the available metadata permits it.
- [ ] Observe at least seven representative days after Phases 2 and 3, unless quota containment
      requires earlier caching.

Choose one branch:

### Branch A — Endpoint is still required

- [ ] Switch the route from the cookie-aware server client to the anonymous public read client.
- [ ] Serve the same filtered action shape from the existing tagged server cache.
- [ ] Calculate an ETag from the public snapshot revision/checksum.
- [ ] Honor `If-None-Match` with `304` and no JSON body.
- [ ] Add an explicit shared-cache policy no longer than the already accepted five-minute service
      worker window, unless product requirements approve a different staleness bound.
- [ ] Ensure responses never include `Set-Cookie` and do not vary by authenticated user.
- [ ] Preserve cache-tag invalidation on all public-data mutations.
- [ ] Test first request, repeat request, conditional request, mutation invalidation, disabled
      Supabase, and error behavior.
- [ ] Verify a repeat request becomes a shared-cache hit at the actual Cloudflare/VPS deployment
      boundary; do not assume headers alone guarantee caching.

### Branch B — Endpoint is no longer required

- [ ] Remove it from the service worker's public API cache list first.
- [ ] Ship the service-worker change and allow the supported client-update window to elapse.
- [ ] Confirm traffic has fallen to an agreed negligible threshold.
- [ ] Remove the route or return a small, documented retirement response.
- [ ] Remove route tests and stale architectural documentation only after the compatibility window.

### Success criteria

- Required endpoint: repeat and conditional requests do not repeatedly fetch or transmit the full
  Supabase result set.
- Retired endpoint: no supported client depends on it, and traffic remains negligible.

### Rollback

Required branch: remove the cache headers/ETag and restore the prior client. Retired branch: restore
the route for the compatibility window. Neither branch changes stored game data.

## Phase 5 — Decide whether baseline compaction is justified

### Independent problem

Even after call amplification is fixed, every approved action enlarges the replay snapshot. At the
2026-08-14 measurement, the 595 approved public rows contributed approximately 1.2 MB to every
complete approved snapshot. Synced rows correctly leave the replay set but remain available for
public contribution history.

### Entry gate

Do not implement compaction as part of the initial incident response. Enter a separate design phase
only when all of the following are true:

- Phases 1 through 4 are deployed;
- at least seven representative days of post-deployment measurements exist;
- uncached egress remains above the 150 MB/day target; and
- approved-snapshot payload bytes, rather than call amplification or another source, remain a material
  measured contributor.

If the gate is not met, record compaction as deferred and leave approved rows unchanged.

### Decision actions

- [ ] Record approved-snapshot calls, bytes, and share of uncached egress after the primary fixes.
- [ ] Estimate the maximum monthly saving from compaction before approving any migration or write
      freeze.
- [ ] If the gate is met, create a separate reviewed compaction plan and recovery drill. Do not add its
      schema, RPCs, or deployment protocol to this incident plan.
- [ ] Use `.agents/skills/game-action-compaction/` to prepare and locally verify a manifest-based
      candidate when appropriate. The skill is not the deployment/status cutover design.

### Required constraints for any future plan

- Never complete the status cutover before the activating release contains the action's effect and
  full published-domain parity has been proven.
- Never activate a baseline containing an action while that action remains replayable;
  non-idempotent array additions and deletes make double replay unsafe.
- A naive serial `deploy then sync` or `sync then deploy` sequence cannot satisfy both invariants by
  itself. The future plan must define an exclusion manifest or an equivalent coordinated transition.
- Bind one reviewed exact-row manifest to the expected replay epoch, complete approved action
  revision, and canonical row-content digests. Use an enforced write-freeze/cutover mechanism so
  code deployment and status changes cannot race.
- Exclude compacted rows from replay and trusted replay validation, but retain them for contribution
  and history semantics.
- Require before/transition/after published-domain parity and an explicit post-sync recovery path.

### Success criteria

- The phase is either documented as unnecessary from measured data or handed off to a separately
  reviewed implementation plan with quantified expected savings.

### Rollback

This decision phase changes no application or database state. Remove the follow-up proposal if later
measurements show that compaction is not worthwhile.

## Phase 6 — Measure auth and permission chatter as a separate follow-up

### Independent problem

The root layout awaits `getUserData()` for every render. Authenticated navigation, RSC requests, and
prefetch behavior can therefore fan out into repeated user, group, permission, and block checks.
These responses are small and are not the main egress driver, but the approximately 40,000 grant RPC
calls in the retained window justify a separate follow-up.

### Disposition

This work is outside the egress incident's implementation scope. After the primary fixes, record a
representative authenticated navigation trace with call counts, response bytes, and p50/p95 latency.
Do not redesign the public shell or add an auth RPC in this plan.

If the trace shows a worthwhile latency, database-load, or cost problem, create a separate auth
performance proposal. That proposal must preserve every server-side authorization decision,
resource-scoped and inherited-group semantics, block evaluation, token-refresh behavior, and denial
when client state is stale or forged.

### Success criteria

- The follow-up measurement and its disposition are recorded without blocking closure of this
  incident.

## Phase 7 — Decide whether per-target action reads are justified

### Independent problem

After build amplification is addressed, runtime ISR can still fetch the entire approved snapshot to
render one target. This phase is deliberately measurement-gated because a relational target index
adds write-path and schema complexity.

### Entry gate

Enter this phase only when all of the following are true:

- Phases 1 through 4 are deployed;
- at least seven representative days of post-deployment metrics exist;
- uncached egress remains above the 150 MB/day target; and
- full approved-snapshot runtime reads remain a material measured contributor.

### Decision actions

- [ ] Measure full-snapshot runtime calls and bytes separately from build artifact generation and the
      legacy endpoint.
- [ ] Estimate the maximum monthly saving from per-target reads.
- [ ] If the gate is met, create a separate reviewed schema and write-path proposal; do not add a
      target relation speculatively in this incident plan.

### Required constraints for any future plan

- Reuse canonical target extraction for every editable entity type.
- Maintain target rows transactionally through every trusted action-state change.
- Preserve ordered replay, RLS/RPC boundaries, and a full-snapshot comparison path until zero
  mismatches are demonstrated.
- Add migrations and regenerate database types only after the separate design is approved.

### Success criteria

- The phase is either documented as unnecessary from measured data or handed off to a separately
  reviewed implementation plan with quantified expected savings.

### Rollback

This decision phase changes no application or database state.

If both Phase 5 and Phase 7 meet their gates, compare quantified savings, correctness risk, and
operational cost before opening follow-up work. Choose at most one first; do not implement compaction
and a target relation in parallel.

## Recommended execution order

| Order        | Work                                           | Expected impact | Risk   | Reason                                                   |
| ------------ | ---------------------------------------------- | --------------- | ------ | -------------------------------------------------------- |
| Prerequisite | Preview containment                            | Immediate       | Low    | Stops avoidable quota growth while code is prepared      |
| 1            | Phases 1–3: one shared build-data artifact     | Very high       | Medium | Removes both repeated bulk reads with one implementation |
| 2            | Phase 4: public endpoint decision              | Low–medium      | Low    | Handles old clients and an uncached 1 MB response        |
| 3            | Seven-day observation and incident disposition | Confirming      | None   | Determines whether any conditional follow-up is needed   |

Phases 5 and 7 proceed only by opening separate reviewed plans after their entry gates are met.
Phase 6 is a separate performance backlog measurement and does not block incident completion.

## Per-phase validation commands

Use the commands required by the phase rather than deferring all verification to the end:

```powershell
npm run lint
npm run type-check
npm test -- <relevant-test-path-or-pattern>
```

For cross-cutting build or published-data changes:

```powershell
npm test
npm run validate:actor-profiles
npm run build:skip-images
```

Run `npm run validate:actor-profiles` only when actor-profile data is affected.

After any Supabase migration:

1. replay the local database;
2. run the relevant database tests against the local or approved staging environment;
3. run `npm run generate:database-types`;
4. commit the migration and `src/data/database.generated.ts`; and
5. deploy according to the repository's migration and `DEPLOY.md` rules.

## Overall completion criteria

The incident is complete only when:

- [ ] the organization records a complete billing cycle below 5 GB uncached egress, or a documented
      product decision accepts a paid plan;
- [ ] seven-day average uncached egress is below 150 MB/day with representative traffic and normal
      deployment activity;
- [ ] approved-snapshot and contributor-source query counts are each at least 95% below the audited
      equivalent workload;
- [ ] each stable Supabase-enabled Vercel build attempt performs exactly one approved-snapshot bulk
      fetch and each deliberately disabled attempt performs zero; any drift retry is separately logged
      and remains within the same per-attempt budget;
- [ ] concurrent cold character lookups and a stable enabled multi-worker build attempt each
      demonstrate one contributor-source fetch for their respective cache population or build
      artifact, while disabled mode demonstrates zero;
- [ ] every accepted build demonstrates one unchanged replay epoch from immediately before the
      approved-action bulk read through the end of post-processing; contributor attribution is
      explicitly outside this epoch contract;
- [ ] every retry uses a fresh artifact path as an explicit cache-key input and cannot reuse an earlier
      attempt's artifact or Next fetch-cache value;
- [ ] contributor attribution, published revisions, route data, and action history pass equivalence
      tests;
- [ ] the epoch and contributor-source RPC grants and minimal return shapes pass database tests, the
      contributor RPC exposes only derived attribution, and no authorization, RLS, cache-invalidation,
      or disabled-Supabase regression is present;
- [ ] the shared guarded server-side fetch transport rejects every source query from a Next.js build
      worker across publishable, admin, cookie-aware server, route-handler, and proxy clients, including
      direct table and contributor-RPC calls, while the separately constructed generator client remains
      within its per-attempt budgets;
- [ ] the chosen preview policy is documented and unnecessary temporary containment is removed; and
- [ ] final measurements, deployment identifiers, and any deliberately deferred phases are recorded
      before moving this plan to `docs/archive/completed/`.

## Explicit non-goals

- Upgrading to Pro is not an implementation fix and is not part of this plan. It remains a business
  fallback if optimized legitimate usage still exceeds the Free-plan quota.
- Moving the 42 MB article image bucket is not justified by the current evidence.
- Deleting synced contribution history is not an acceptable bandwidth optimization.
- Adding speculative indexes does not reduce response bytes and should not be used as a substitute
  for call and payload reduction.
- Implementing baseline compaction, a per-target relation, or an auth-shell redesign before their
  measurements justify separate work is not part of this incident response.
- Resetting production `pg_stat_statements` is unnecessary; use retained snapshots and deltas.
