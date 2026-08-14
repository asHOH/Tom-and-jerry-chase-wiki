# Supabase Egress Remediation Plan

**Status:** Proposed  
**Created:** 2026-08-14  
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

- Do not mark an approved action `synced` until its effect is present in the deployed checked-in
  baseline and pre/post published output has been proven equivalent.
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
  must not require or opportunistically use the Supabase secret/service-role key.
- Keep build artifacts free of user emails, IP addresses, tokens, or other private auth data.
- Run production action-table mutations only through existing trusted application/RPC paths.
- Use `tjwiki-test` for database-changing validation. Do not run the admin action measurement SQL
  against production.

## Shared implementation boundary

Phases 1 through 3 have separate success criteria but intentionally share one implementation: one
build wrapper, one versioned build-data artifact, one build identity, one cleanup path, and one final
summary. Implement and deploy them together unless a smaller change can reuse that same boundary;
do not create separate contributor and approved-action artifact systems merely to preserve phase
independence.

Phase 0 and Phase 4 remain independently deployable. Phases 5 through 7 are decision gates, not part
of the initial incident implementation. If their measurements justify further work, create a separate
reviewed design rather than expanding this remediation in place.

## Phase 0 — Contain preview-build amplification

### Independent problem

Every preview deployment can regenerate hundreds of static routes while connected to Supabase. A
rapid sequence of pushes, dependency branches, canceled builds, or superseded builds can consume a
material part of the monthly quota before a code fix reaches production.

### Actions

- [ ] Temporarily batch commits before pushing branches that trigger Vercel previews.
- [ ] Cancel superseded preview builds as soon as a replacement is queued.
- [ ] Review the Vercel Git deployment policy and avoid building automated dependency branches that
      do not require a live application preview.
- [ ] Choose one temporary containment mode until Phases 2 and 3 are deployed:
  - pause automatic previews; or
  - set `NEXT_PUBLIC_DISABLE_ARTICLES=1` only in the Vercel Preview environment, accepting that auth,
    articles, and other Supabase-backed preview features will be unavailable; or
  - keep one designated integration preview connected to Supabase and make other branch previews
    baseline-only.
- [ ] Record the selected mode and the date it was enabled.
- [ ] Do not change VPS production environment variables as part of this containment phase.

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

### Independent problem

The current build lets static workers reach bulk data sources independently and does not report how
many database reads were performed. That permits both the current amplification and silent
regression.

### Design

Make one pre-build generator the only component allowed to perform the two bulk database reads during
a static build. It writes one atomic, build-identity-bound artifact under `.tmp/`; all Next workers
read that artifact and must fail rather than query Supabase when it is unavailable or invalid.

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
- [ ] Write one versioned artifact atomically under a build-specific `.tmp/` path and remove it in a
      `finally` path. Overlapping local builds must not share paths or identities.
- [ ] Pass one explicit artifact-path environment variable to `next build`; do not expose it to normal
      runtime or ISR.
- [ ] Add one module-scoped, server-only artifact reader tagged with
      `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG`; selectors must not bypass it with raw filesystem reads.
- [ ] Emit one generator summary containing each source's fetch count, rows, bytes, duration, and
      payload checksum, plus the attempt number. Report lightweight epoch-validation calls separately
      from bulk fetches.
- [ ] Enforce mode- and attempt-specific budgets: exactly one fetch for each bulk source in a stable
      Supabase-enabled attempt, zero database fetches in a deliberately disabled attempt, and never
      more than one fetch per bulk source within any attempt. A bounded drift retry starts a new,
      separately logged attempt and does not relax its per-attempt budget.
- [ ] Make CI fail if the applicable budget is exceeded or any build worker attempts a source query.
- [ ] Update `build`, `build:debug`, and `build:skip-images` to use the wrapper without changing their
      validation, docs generation, Serwist, or image-optimization contracts.
- [ ] Document how to compare Vercel build summaries with retained `pg_stat_statements` deltas.

### Tests

- [ ] Unit-test summary calculation and prove that action contents, IDs, user IDs, and credentials
      cannot appear in it.
- [ ] Unit-test the generator with mocked sources: assert exactly one invocation of each bulk query in
      enabled mode, zero in disabled mode, and the same per-attempt limit across a drift retry.
- [ ] Add a build contract proving worker readers use only the artifact and cannot fall back to
      Supabase.
- [ ] Prove an artifact-backed `force-static` route records
      `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and is regenerated after that tag is invalidated.
- [ ] Test atomic replacement, build-identity isolation, generator failure, and cleanup.

### Success criteria

- Every build attempt ends with one concise game-data read summary.
- Static workers perform zero bulk database queries.
- CI detects any increase above one generator fetch per bulk source per enabled attempt and any
  database fetch in deliberately disabled mode.

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

1. `queryCharacterContributorSourceRows()` performs the existing Supabase query once and returns the
   minimum fields needed for attribution.
2. `buildCharacterContributorIndex(rows)` parses every normalized action once and returns a plain,
   cache-serializable record keyed by character ID.
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
acquisition; it must be cleared after settlement so tag invalidation and the one-hour revalidation
contract remain effective.

### Actions

- [ ] Extract a pure `buildCharacterContributorIndex()` function.
- [ ] Rename the database function so it no longer accepts a misleading `characterId` parameter.
- [ ] Parse each action with the existing `normalizePublicActionEntries()`,
      `flattenActionEntries()`, and `getGameDataActionTarget()` helpers.
- [ ] Count at most one contribution per action and character unless the current behavior explicitly
      counts multiple matching entry fragments. Capture the existing behavior in tests before
      changing the loop.
- [ ] Preserve author ordering by contribution count descending and nickname ascending.
- [ ] Preserve deduplication against checked-in content writers and contributor IDs.
- [ ] Cache the complete plain-object index under one global runtime key, without `characterId`, and
      define the cached wrapper once at module scope.
- [ ] Wrap the runtime cache-miss callback in a process-local in-flight promise so simultaneous cold
      misses share one query without retaining a resolved value beyond the cache population attempt.
- [ ] Extend the shared generator with one contributor-index payload built from exactly one source
      query. Store only derived public `{ id, name, contributionCount }` entries, source row count,
      character count, and checksum.
- [ ] Add a server-only contributor reader for the shared artifact. Build workers must fail on a
      missing, invalid, or build-identity-mismatched payload and never fall back to Supabase. It must
      select its payload through the shared tagged artifact reader, not read the file directly.
- [ ] Keep the existing `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and one-hour revalidation so publication,
      approval, revocation, and mark-synced flows invalidate attribution.
- [ ] Ensure malformed or unsupported action entries are handled consistently with existing replay
      normalization.
- [ ] Keep `getContentWritersForCharacter()`'s public return type unchanged.

### Tests

- [ ] Snapshot current outputs for characters with static authors, dynamic editors, duplicate names,
      and multiple contributions.
- [ ] Start multiple character lookups concurrently with `Promise.all` against an empty runtime cache
      and assert one source query, including the error-and-retry path after the shared promise rejects.
- [ ] Test that multiple simulated build-worker readers use the shared artifact generated by one
      contributor query and that no reader can fall back to Supabase.
- [ ] Prove contributor-backed character pages retain the public-actions cache-tag dependency and are
      regenerated after publication invalidation.
- [ ] Test an action touching multiple characters.
- [ ] Test multiple entry fragments touching the same character.
- [ ] Test synced and approved actions; reject pending, rejected, and revoked rows.
- [ ] Test null creators, missing public profiles, blank nicknames, and malformed entries.
- [ ] Test deterministic ordering independent of input-row order where ordering is not semantically
      meaningful.
- [ ] Run relevant Jest tests, `npm run lint`, and `npm run type-check`.
- [ ] Run `npm run build:skip-images` with Supabase pointed to `tjwiki-test` when practical.

### Deployment gate

- [ ] Compare every generated character page's writer/editor output before and after the change.
- [ ] Confirm a stable enabled multi-route build attempt reports exactly one contributor-source
      database fetch, not one per worker or character, and a disabled attempt reports zero.
- [ ] Confirm publication invalidation causes concurrent next lookups to rebuild the runtime index
      with one source query.

### Success criteria

- Reduce the character-contributor source query by at least 95% under an equivalent build workload.
- Perform exactly one character-contributor source database fetch per stable enabled build attempt and
  zero in disabled mode, independent of route concurrency and worker count.
- Preserve byte-for-byte-equivalent serialized contributor/editor props for all existing characters,
  excluding irrelevant object-key ordering.
- Add no migration and no new production write path.

### Rollback

Restore the per-character implementation. Because this phase changes only derived reads and caches,
rollback requires no data repair.

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

The prepass must acquire a consistent snapshot using only the publishable-key configuration supported
by production. It reads the lightweight replay epoch, performs the existing canonical public bulk
query, then reads the epoch again. It accepts the rows only when both non-null epochs match. After
`next build` finishes, but before its output is accepted, the wrapper reads the epoch once more. If any
check differs, the wrapper discards that attempt and reruns the entire prepass and build, with a fresh
artifact, up to three total attempts. This optimistic fence gives the bulk query a stable epoch without
adding another public bulk endpoint or turning a routine race into an immediate outage.

The shared artifact should contain only the public and derived fields required by its two readers:

```ts
type BuildGameDataArtifact = {
  schemaVersion: 1;
  buildIdentity: string;
  fetchedAt: string;
  approvedActions: {
    replayEpoch: number | null;
    rowCount: number;
    checksum: string;
    rows: PublicActionRow[];
  };
  contributors: {
    sourceRowCount: number;
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

| Mode                  | Credentials              | Bulk reads per attempt      | Epoch validation                              |
| --------------------- | ------------------------ | --------------------------- | --------------------------------------------- |
| Deliberately disabled | None                     | Zero                        | None                                          |
| Supabase enabled      | URL plus publishable key | Exactly one per bulk source | Lightweight public checks, counted separately |

Add only a narrowly scoped public epoch RPC for the prepass and post-build guards. Grant execution to
`anon` and `authenticated` after revoking the default `PUBLIC` grant. Because the epoch table itself
remains service-role-only, make this a no-argument `SECURITY DEFINER` function owned by the migration
owner, with a fixed safe `search_path` and an exact scalar query. It returns one epoch and exposes no
action or profile fields. Keep the existing canonical public bulk query for the rows; do not add a
second public bulk-snapshot endpoint. The generator always uses the publishable client even if a
secret key happens to exist in the environment. Controlled previews use `tjwiki-test` publishable
credentials; arbitrary preview branches do not receive production secrets.

### Actions

- [ ] Extend the shared build-data generator and artifact schema with the approved-action payload.
- [ ] Keep the wrapper's `DEPLOY_BUILD_ID`, `next.config.ts` build ID, embedded
      `TJWIKI_BUILD_IDENTITY`, and artifact identity identical.
- [ ] Reuse the canonical ordered query and validation logic; do not create a second interpretation
      of public-row eligibility.
- [ ] Add the narrowly scoped public epoch-only RPC described above, including explicit grants, fixed
      `search_path`, generated database types, and permission tests.
- [ ] Add a publishable-client consistency reader that performs epoch-before, the existing canonical
      public bulk query, and epoch-after. Accept the snapshot only when both epochs are equal and
      non-null. Do not call the current admin-only snapshot reader or require `SUPABASE_SECRET_KEY`;
      only the deliberately disabled empty artifact may use a `null` epoch.
- [ ] Validate row shape, ordering, duplicate IDs, supported entity types, and replay decodability.
- [ ] Calculate the approved payload checksum over a canonical serialization of the ordered rows,
      excluding volatile metadata such as `fetchedAt`.
- [ ] Wrap the complete prepass plus `next build` in at most three attempts. On an epoch mismatch,
      delete that attempt's output and artifact, then regenerate both from scratch. Do not retry
      unrelated deterministic failures. If the epoch is unreadable or all drift attempts are
      exhausted, fail clearly and never deploy the candidate. Epoch checks are not bulk fetches.
- [ ] Add a server-only selector used by `getApprovedActionSnapshot()` only when the explicit
      build-artifact environment variable is present. It must consume the shared tagged artifact
      reader so `force-static` pages retain `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` invalidation.
- [ ] Reject a missing, unreadable, stale-build-identity, checksum-invalid, or schema-version-invalid
      artifact instead of silently issuing hundreds of fallback database queries during a build.
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

- [ ] Unit-test artifact validation, checksum verification, schema-version rejection, and build-ID
      mismatch handling.
- [ ] Test the disabled-Supabase empty artifact.
- [ ] Test a production-equivalent publishable-key-only build with `SUPABASE_SECRET_KEY` absent, and
      assert the generator never selects the admin client when a secret is present.
- [ ] Test the epoch RPC grants and scalar return shape, including that it exposes no action, profile,
      or other private fields.
- [ ] Test that multiple simulated approved-action readers use one shared artifact generated by one
      approved-action database fetch.
- [ ] Simulate an approval or moderation change during `next build` and prove the final epoch guard
      retries from a fresh artifact and succeeds when the next attempt is stable. Test repeated drift
      stops after three attempts, and test the unchanged-epoch single-attempt path.
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
- [ ] Exercise the staging replay epoch during a controlled build and confirm one drift retries cleanly
      while repeated drift prevents that deployment from reaching `READY`.
- [ ] Compare a representative set of character, card, map, mode, recommended, and special-skill
      pages with the preceding preview.
- [ ] Verify a post-build publish still invalidates runtime data and appears after ISR/revalidation.

### Success criteria

- Exactly one approved-action bulk fetch per stable enabled build attempt, zero in disabled mode, and
  never more than one within any attempt, independent of static route count or worker count.
- No build output is accepted when the approved replay epoch changes between the prepass and the end
  of `next build`.
- Artifact-backed static routes remain attached to `PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG` and refresh
  from the runtime reader after invalidation.
- Production-equivalent builds succeed without a Supabase secret, and the only new public RPC exposes
  the replay epoch rather than snapshot rows.
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

## Phase 5 — Decide whether replay compaction is justified

### Independent problem

Even after call amplification is fixed, every approved action enlarges the replay snapshot. The 595
currently approved public rows contribute approximately 1.2 MB to every complete approved snapshot.
Synced rows correctly leave the replay set but remain available for public contribution history.

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

### Required constraints for any future plan

- Never mark an action synced before its effect is present in the deployed baseline.
- Never deploy a baseline containing an action while also replaying that action; non-idempotent array
  additions and deletes make double replay unsafe.
- Use one reviewed action manifest and one enforced write-freeze/cutover mechanism so code deployment
  and status changes cannot race.
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

| Priority | Work                                           | Expected impact | Risk   | Reason                                                   |
| -------: | ---------------------------------------------- | --------------- | ------ | -------------------------------------------------------- |
|        0 | Phase 0: preview containment                   | Immediate       | Low    | Stops avoidable quota growth while code is prepared      |
|        1 | Phases 1–3: one shared build-data artifact     | Very high       | Medium | Removes both repeated bulk reads with one implementation |
|        2 | Phase 4: public endpoint decision              | Low–medium      | Low    | Handles old clients and an uncached 1 MB response        |
|        3 | Seven-day observation and incident disposition | Confirming      | None   | Determines whether any conditional follow-up is needed   |

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
- [ ] the approved replay epoch remains unchanged across every accepted snapshot-backed build;
- [ ] contributor attribution, published revisions, route data, and action history pass equivalence
      tests;
- [ ] no authorization, RLS, cache-invalidation, or disabled-Supabase regression is present;
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
- Implementing replay compaction, a per-target relation, or an auth-shell redesign before their
  measurements justify separate work is not part of this incident response.
- Resetting production `pg_stat_statements` is unnecessary; use retained snapshots and deltas.
