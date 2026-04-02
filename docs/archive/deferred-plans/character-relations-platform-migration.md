# Character Relations Platform Migration

## Status

Deferred indefinitely.

The lightweight relation cleanup path is complete. This document is not an active implementation plan anymore. It exists only to record the cost and expected effect of the large-scale migration that was explicitly not chosen.

## What This Migration Would Do

Introduce `entityType: 'characterRelations'` as a first-class editable and publishable entity for shared character-character relation edges.

That would change the system from:

- page-local relation overlays stored under `characters.<id>.*`
- hybrid runtime reads that merge shared graph data with per-page overlays

to:

- canonical shared relation-edge records
- page views projected from relation entities instead of character-page overlay arrays
- publish, replay, history, and moderation flows that understand relation edges directly

## Expected Effect

If this migration were completed, it would buy:

- one canonical stored record for a shared character-character relation fact
- no duplicated side-specific editing of the same displayed relation across two character pages
- cleaner moderation and history semantics for relation edits
- a future path toward editing shared relation edges directly instead of pretending page-local overlays are canonical data

## Actual Cost

This is expensive because it is not a relation-module refactor. It is a platform migration.

It would require coordinated changes across at least:

- edit-mode entity registries and stores in [EditModeContext.tsx](/d:/P/Tom-and-jerry-chase-wiki/src/context/EditModeContext.tsx)
- draft counting and page summary logic that currently assumes character-page-relative paths
- server public replay in [publicActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/gameData/publicActions.ts)
- client public replay in [usePublicGameDataActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/hooks/usePublicGameDataActions.ts)
- wiki history mapping in [wikiHistoryFromActions.ts](/d:/P/Tom-and-jerry-chase-wiki/src/lib/wikiHistoryFromActions.ts)
- current relation editing UI, which still edits page-local overlays rather than shared edge records
- likely moderation, tooling, and patch-generation assumptions tied to `characters` action paths

## Risk Profile

The main risks are:

- breaking replay compatibility for existing `characters` relation actions
- breaking draft counts or per-page draft summaries
- introducing confusing dual-write or mixed-source behavior during migration
- expanding the review surface far beyond character relation UI code

This is the kind of change that needs its own migration design, compatibility strategy, and rollback plan. It is not the next incremental cleanup step.

## When To Revisit

Only revisit this if relation editing becomes a strategic content workflow and the team explicitly wants:

- first-class relation history and moderation
- canonical edge-level editing
- platform support for relation entities across edit, replay, and history systems

If those goals are not important enough to justify a platform migration, this plan should stay archived.
