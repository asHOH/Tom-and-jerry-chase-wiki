# Article submission, moderation, and cache refresh

**Status:** Phase one implemented; database/browser integration acceptance outstanding; phase two planned  
**Date:** 2026-09-19  
**Review corrections:** 2026-09-20  
**Inspected baseline:** `8f7a2d5df68fb46d210046ef380f416703d0af46`

## Handoff and objective

Implement this plan in two focused changes: cache correctness and moderation reliability first,
then notification/result/UI consistency. This document supplies the context and decisions needed
without the originating conversation. Read repository `AGENTS.md` and `.codex/AGENTS.md`, if present,
before implementation; inspect current code and preserve any subsequent fixes.

After a successful publication or revocation, a fresh server read must observe the database's
published version. The submitter must receive feedback matching the actual outcome. Preserve
background refresh where stale data is acceptable, existing permission checks, and database
publication invariants.

The scope is implementation and local validation. Production mutations, deployment, and remote
database changes are not part of this plan. No database migration is expected.

## Historical decisions

These findings come from local Git history, not inferred incident reports. Inspect commits with
`git show <hash>` if additional context is needed.

| Date   | Commit                 | Decision and actual effect                                                                                                                                                                                                     |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Jan 2  | `388657af`             | Introduced article caching and tags; moderation initially used `revalidateTag(tag, { expire: 0 })`.                                                                                                                            |
| Jan 2  | `8a09e23b`             | Changed moderation to `'max'`, allowing stale reads during refresh. The commit supplies no detailed rationale.                                                                                                                 |
| Feb 7  | `33fbd8c2`, `45a1bc52` | Skipped invalidation on Vercel to avoid heavy invalidation, then reverted the change the same day. Do not restore this exception.                                                                                              |
| Feb 7  | `0bd1d2bb`             | Titled “disable caching for preview environments,” but set `revalidate: false`: caching indefinitely until invalidation, not bypassing caching.                                                                                |
| Feb 11 | `bffbc7fc`             | Added `nuke` for article details and `expire` for lists. Comments explicitly intended immediate article freshness and background list refresh, but the API mapping was wrong. Only creation and moderation adopted the helper. |
| Feb 23 | `1cea32e5`             | Caught the unsupported `updateTag` call in route handlers and fell back to `'max'`. Both strategies consequently use background refresh in these routes.                                                                       |
| Aug 7  | `24e75d87`             | Introduced the current published-version pointer, publication ordering, and synchronized article metadata. Preserve this database model.                                                                                       |
| Aug 27 | `4847b667`             | Removed the preview revalidation exception, capped configured revalidation intervals at 12 hours, added concurrent-read deduplication and the `users` tag. Left the invalidation helper unchanged.                             |

## Confirmed behavior at the inspected baseline

- [cacheTags.ts](../src/lib/cacheTags.ts) maps `nuke` to `'max'`. `expire` attempts `updateTag`,
  catches its route-handler exception, logs a warning, and also calls `'max'`. Its comments reverse
  the actual API semantics.
- Creation uses the helper; existing-article editing and pending editing call `revalidateTag`
  directly. These paths do not share an explicit refresh policy.
- Moderation commits its RPC, then performs a best-effort lookup for the article ID and notification
  metadata. A failed lookup skips targeted invalidation. Global `articles` invalidation does not
  reach every detail/history cache.
- `articles` is not just a list tag: it also covers some detail data, character-page embedded
  article bodies, recent changes, contribution data, sitemap data, and token previews.
- Creation and editing always display “waiting for review,” although their RPCs return automatic
  approval/rejection outcomes. Creation discards that status from its response.
- Article notification decisions are repeated in creation, editing, and moderation. The shared
  notification layer already implements deduplication and automatic-decision suppression.

### Read/write map

| Area                       | Entry points / behavior to inspect                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writes                     | `src/app/api/articles/submit/route.ts`, `src/app/api/articles/[id]/edit/route.ts`, `src/app/api/articles/edit-pending/[versionId]/route.ts`, `src/app/api/moderation/[versionId]/route.ts`               |
| Detail and history         | `src/lib/articles/server/detailQueries.ts`: metadata uses article + global tags; approved-version and history reads use article + article-version tags. Some intervals are 12 hours.                     |
| Lists and embeds           | `src/lib/articles/server/listQueries.ts`, `characterArticleQueries.ts`: lists use global article/category tags; embeds use only the global article tag, with an eight-hour interval.                     |
| Other consumers            | `src/app/(main)/articles/sitemap.ts`, `src/lib/recentChanges.ts`, `src/lib/users/publicProfile.ts`, `src/lib/users/contributionActivity.ts`                                                              |
| Previews and review queues | `src/app/api/articles/preview/route.ts` caches by token for 30 seconds under `articles`. Pending article/moderation GET routes read directly from the database.                                          |
| Clients                    | `src/app/(main)/articles/new/NewArticleClient.tsx`, `[id]/edit/EditArticleClient.tsx`, `pending/PendingClient.tsx`, `[id]/history/ArticleHistoryClient.tsx`; history currently reloads after revocation. |
| Shared infrastructure      | `src/lib/cacheTags.ts`, `src/lib/serverCache.ts`, `src/lib/notificationUtils.ts`, `src/hooks/useContributionSubmissionFeedback.ts`                                                                       |

## Recommended implementation contract

### 1. Correct the primitive, preserve unrelated behavior

Make `invalidateCache` synchronous with required, explicit modes:

```ts
export function invalidateCache(tag: string, mode: 'immediate' | 'background'): void {
  revalidateTag(tag, mode === 'immediate' ? { expire: 0 } : 'max');
}
```

Remove `updateTag`, the expected-exception fallback, misleading comments, and unnecessary awaits.
Immediate expiration means the next server read must fetch fresh data; it does not eagerly rebuild
all consumers or push updates to existing browser tabs.

Immediate invalidation must also detach matching in-flight acquisitions in `serverCache.ts`.
Its process-wide promise map otherwise lets a post-mutation read join a pre-mutation read without
consulting Next's cache. Preserve unrelated acquisitions and prevent an older promise's cleanup
from removing a replacement acquisition. This narrowly scoped change is part of phase one.

Search every caller. Existing user registration/update and admin group-assignment/group-management
callers currently receive `'max'` behavior through the default. Migrate them explicitly to
`background` to preserve behavior. Do not silently change their freshness contract. Existing
category-route `'max'` behavior can remain unchanged.

### 2. Centralize article invalidation with this policy

Add one small helper in `src/lib/articles/` for the article-specific tag set and policy. Keep
authorization, input validation, and RPC calls in their existing routes.

| Mutation outcome                                | Individual article + article-version tags | Global `articles` | Sitemap     | Token previews |
| ----------------------------------------------- | ----------------------------------------- | ----------------- | ----------- | -------------- |
| Automatic/manual approval                       | Immediate                                 | Background        | Background  | Immediate      |
| Revocation, including an older approved version | Immediate                                 | Immediate         | Immediate   | Immediate      |
| Pending or automatically rejected submission    | No published-content invalidation         | Background        | Unnecessary | Immediate      |
| Pending edit or manual rejection                | No published-content invalidation         | Background        | Unnecessary | Immediate      |

Use the actual RPC outcome for creation/editing. For pending-only edits, the existing RPC enforces
that only pending new-article submissions may be modified. Preserve that restriction.

Add one dedicated preview tag and assign it to the token-preview cache, retaining its existing
token key and 30-second interval. Invalidate this tag immediately after each successful article
mutation. Keeping the existing `articles` tag on previews is acceptable. The returned `_tags`
metadata in that route does not register Next.js cache tags.

Keep broad `articles` invalidation for now: it reaches aggregate consumers beyond public lists.
Approval may briefly leave list/embedded content stale; revocation must expire embedded copies as
well as direct reads. Do not introduce per-character/category tag topology until measurements show
the broad tag is too expensive. Do not remove cache coverage based only on tag names.

### 3. Make required refresh independent of optional notification lookup

After the existing moderation permission guard, resolve the immutable target article ID through a
server-side lookup before invoking the moderation RPC. If this lookup fails, do not mutate. The RPC
must remain the final authority on permissions, blocking, and valid state transitions; a pre-read
is not authorization and must not replace its checks.

After the RPC succeeds, invalidate using that known article ID. Notification metadata may still
be read separately and best-effort. Do not make cache refresh depend on notification success.
Returning metadata from the moderation RPC could improve this later, but a migration is unnecessary
for this fix.

Distinguish failed writes from failures after a committed write:

- An RPC failure remains a structured non-2xx error; do not send success notifications or invalidate
  as though the write succeeded.
- A detected invalidation failure after commit must not become “submission failed; retry.” Attempt
  remaining required tags, log the mutation identifiers and failed tags, and return the successful
  mutation result with `warning: 'cache_refresh_failed'`.
- Clients display a zh-CN warning that the operation succeeded but displayed data may lag. They must
  not automatically resubmit the write. Notification failures remain separately logged and do not
  change the publication result.
- Apply the same separation in the moderation client: after a successful response, a failed
  optional thank-you request must report that approval succeeded and only thanks failed. Still
  attempt review-queue refresh. A failed queue refresh must likewise retain the successful
  moderation outcome. Neither follow-up may resubmit moderation or report that it failed.

This warning covers failures detectable while scheduling invalidation. It is not a durable delivery
guarantee for later framework cache work. Do not add a queue/outbox or silently retry the mutation.

### 4. Normalize results and reuse notification decisions

Expose additive, consistent response fields: `article_id`, `version_id`, and `status`
(`pending`, `approved`, `rejected`, or `revoked`), plus the optional refresh warning. Preserve existing
response fields until all callers/tests have been checked. A successful pending-only edit reports
`pending`; moderation derives the resulting status from its successfully committed action.

Extract a small article notification helper using `notifyArticleVersionSubscribers` and
`publishNotification`. Preserve pending-recipient selection, automatic/manual distinction,
create/edit wording, reviewer feedback, rejection links, dedupe keys, and automatic-notification
suppression for moderators. Do not add a revocation notification or a generic event framework.

Creation/editing must read the response and show the actual status. Approved submissions should
offer/navigate to the published article; pending/rejected submissions should use the existing
contribution-feedback flow with accurate wording. Use the existing submission-link helpers and
nickname lookup rather than inventing profile routes. Keep navigation ownership in the page client.

Verify navigation to an already visited article and relevant SWR history/review entries. Refresh
the destination's client data after server invalidation; do not assume `router.push` alone proves
freshness, or that `router.refresh` clears server caches. Retaining the current revoke reload is
acceptable for the first change.

## Delivery and acceptance

### Change 1 — cache correctness and moderation reliability

- [x] Implement explicit primitive modes and migrate all existing callers.
- [x] Add the article policy helper and preview tag; wire all four write routes.
- [x] Resolve the moderation target before mutation; separate notification failures from refresh.
- [x] Add committed-write warning handling and correct cache comments.
- [x] Detach matching in-flight reads on immediate invalidation; test the publication race.
- [x] Display refresh warnings in clients and isolate thank-you/queue-refresh failures after success.
- [x] Test exact tag/profile coverage and failure paths, including preserved non-article behavior.
- [ ] Complete the database-backed, production-mode warmed-cache integration check.

### Change 2 — notification and UI consistency

- [ ] Normalize additive response fields and consolidate article notification decisions.
- [ ] Consume normalized statuses in create, edit, and moderation clients without duplicate writes.
- [ ] Verify destination refresh and preserve review-queue/SWR updates.
- [ ] Test automatic/manual approval, rejection, pending edits, and notification failures.

Required acceptance scenarios:

1. Warm detail, history, and embed caches; approve a changed article. A subsequent direct server
   read observes the new title/body/current version. Lists/aggregates may refresh in the background.
2. Revoke the current version: detail uses the previous approved version, or returns unavailable if
   none remains. History and embedded copies no longer serve the revoked content on fresh online
   reads. Revoke an older version: current publication remains unchanged, but history updates.
3. Edit pending content, then revisit its token preview: it shows the updated draft. Rejection updates
   preview status without replacing the published body.
4. A pre-mutation moderation lookup failure causes no RPC mutation. A detected post-commit cache
   failure returns success plus a warning, still attempts remaining tags, and does not trigger a
   duplicate submission. A notification failure does not prevent invalidation.
5. In phase two, returning from edit to a previously visited article displays the approved change and correct
   outcome message; pending/rejected outcomes never claim publication.
6. Pause a read of the old published version, commit publication/revocation and invalidate, then
   start another read before releasing the first. The new read must not join the old acquisition.
   Settling the old acquisition must not remove its replacement or affect unrelated acquisitions.
7. Approve successfully, then fail the optional thank-you request with a network exception. Report
   approval success plus the follow-up failure, refresh the queue, and submit moderation only once.
   Repeat with a failed queue refresh and with a successful response carrying a cache warning.

Use focused unit/route tests for the contract and a production-mode local or staging integration
check with warmed caches for freshness. Mock-only tests and the development server cannot prove
production cache behavior. Use local/staging fixtures only; do not mutate production to validate.
If integration prerequisites are unavailable, report the missing check rather than claim success.

Run `npm run lint`, `npm run type-check`, relevant Jest tests, and Prettier on changed files. Because
the helper spans article/auth/admin callers, run the full Jest suite before handoff. Use
`npm run build:skip-images` when practical for the production-mode check. Follow the repository's
declared Node/npm versions and environment setup; do not bypass validation as a normal default.

## Boundaries and evidence

Keep the existing RPCs and the current-version triggers in
`supabase/migrations/20260806000000_add_article_current_version.sql`. Do not edit historical
migrations, switch to Server Actions, migrate to Cache Components, or disable caching. Limit
`serverCache.ts` changes to in-flight acquisition invalidation and correcting its cache-lifetime
comment; a broader cache rewrite is outside this task.

The 12-hour value caps a revalidation interval, not a guaranteed maximum observable staleness.
Browser Router Cache, SWR, service-worker fallback, and separate deployments are independent of
these server tags. `src/sw.ts` permits public article/history responses to fall back to a cached
response after a three-second network timeout, with a five-minute cache age. Test ordinary online
freshness with a responsive server; do not claim revocation erases offline copies or already-open
tabs. Cross-deployment invalidation is outside this plan.

Review evidence at the baseline: 13 article route tests in four suites passed; they mock cache
functions. A local probe using the installed Next.js request context registered `max` for both
existing helper modes and captured the fallback warning. No live database mutation or browser
freshness test was performed at that point.

### Phase-one implementation evidence — 2026-09-20

- `npm run lint`, `npm run type-check`, changed-file Prettier checks, and `git diff --check` passed.
- The full Jest run passed: 325 suites, 1,888 tests. Coverage includes the in-flight acquisition
  race and replacement cleanup, exact outcome/tag/profile policy, preview tag registration,
  moderation pre-lookup failures, committed cache failures, optional notification failures,
  thank-you network failure, queue-refresh failure, and the warning before revocation reload.
- `npm run build:skip-images` passed, including actor-profile validation and service-worker
  generation. It reported warnings about existing broad site-image file patterns, Edge Runtime
  deprecation, and missing local commit metadata.
- An isolated check used the installed Next.js production cache runtime with fixture values and
  the actual cache helpers. Warmed reads were cache hits; approval immediately refreshed detail,
  history, and preview entries while embeds refreshed in the background; revocation immediately
  refreshed all four. Fixture writes were separated from fills across clock ticks because the
  filesystem cache timestamps have millisecond resolution. This was not an HTTP/database test.
- The database-backed freshness check remains outstanding: local Supabase was not listening on
  ports 54321/54322 and the Docker daemon was unavailable. No database mutations, deployment,
  or browser publication/revocation checks were performed. The runtime probe and mocked tests do
  not establish database pointer rollback behavior or complete browser freshness.

Phase two retains response normalization, status-based submission feedback/navigation, notification
consolidation, and destination refresh. Phase one preserves existing response fields and notification
wording while adding the optional cache warning and isolating committed-write follow-up failures.

Framework references, checked 2026-09-19:

- [revalidateTag: immediate versus background expiration](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [updateTag: Server Actions only](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [unstable_cache: revalidate false retains cached results](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [useRouter: refresh does not invalidate server caches](https://nextjs.org/docs/app/api-reference/functions/use-router)
