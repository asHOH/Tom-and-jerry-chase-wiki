---
name: game-action-patching
description: 'Patch approved game_data_actions into character relation/data files. Use when processing admin-approved data actions, reconciling action logs with refactored code structures, or performing batch content syncs safely.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching Workflow

## What This Skill Produces

- A safe, auditable workflow to apply approved game actions into code.
- Clear progress reporting per chunk with action counts.
- Status updates in game_data_actions (synced or rejected) based on actual patch outcomes.
- Regression checks (just targeted content verification; no linting or type-checking) before finalization.

## When To Use

- You need to process approved actions and patch them into static data files.
- You need deterministic bookkeeping: patched count, skipped count, rejected count, synced count.

## Common Candidate Files

Prioritize these files when mapping character-related actions:

- src/features/characters/data/catCharacters.ts
  - Cat character skills, aliases, descriptions, positioning tags, allocations, special skills.
- src/features/characters/data/mouseCharacters.ts
  - Mouse character skills, aliases, descriptions, positioning tags, allocations, special skills.
- src/data/characterRelations.ts
  - Cross-character/mode/map/card relation graph (counter/collaborator/advantage/disadvantage style entries).

Secondary candidates (when action path indicates these domains):

- src/features/entities/data/\*
  - Entity-specific data updates.
- src/features/special-skills/data/\*
  - Special skill metadata or descriptions.
- src/data/\*.ts (other than characterRelations.ts)
  - Shared static datasets when action path is not character-local.

Selection heuristic:

1. First infer top-level root from action path (character name, relation type, mode/map/card).
2. Prefer feature-local file before generic data file.
3. If action refers to relation semantics (counter/advantage/etc), check characterRelations.ts first.
4. If multiple files are plausible, list candidates and confirm before patching.

## Relation Kind Mapping (Must Follow)

`src/data/characterRelations.ts` is authored in a raw-definition format and normalized at module load.

When an action path expresses relation semantics (`counters`, `counterEachOther`, `counteredBy`, `advantageMaps`, `advantageModes`, etc.), patch the raw definition under the subject character key with this shape:

```ts
{
  A: {
    counters: [
      {
        target: character('B'),
        description: '...',
        isMinor: false,
      },
    ],
  },
}
```

Supported target helpers:

- `character(name)`
- `map(name)`
- `mode(name)`
- `knowledgeCard(name, factionId)`
- `specialSkill(name, factionId)`

Normalization rules:

- `subject` is always the containing character key.
- `group` is auto-generated as `[subject, target]`.
- `relation.description` must stay unset.
- Top-level `description` remains the user-facing text source.
- `isMinor` may be omitted and defaults to `false`.
- Do not add empty relation arrays.
- `factionId` is never inferred for `knowledgeCard` or `specialSkill`; provide it explicitly.
- Stored character `counteredBy` is invalid source shape and must be normalized to `counters`.
- `collaborators` are stored canonically once.
- `counterEachOther` is stored canonically on the mouse side.

Required mapping rules:

1. `X.counters` -> `X.counters[]`, `target = character(Y)`.
2. `X.counteredBy` -> `Y.counters[]`, `target = character(X)`.
3. `X.counterEachOther` -> patch the semantic relationship, then run the normalizer.
4. `X.collaborators` -> patch the semantic relationship, then run the normalizer.
5. `X.advantageMaps` -> `X.advantageMaps[]`, `target = map(Y)`.
6. `X.disadvantageMaps` -> `X.disadvantageMaps[]`, `target = map(Y)`.
7. `X.advantageModes` -> `X.advantageModes[]`, `target = mode(Y)`.
8. `X.disadvantageModes` -> `X.disadvantageModes[]`, `target = mode(Y)`.
9. `X.counteredByKnowledgeCards` -> `X.counteredByKnowledgeCards[]`, `target = knowledgeCard(Y, factionId)`.
10. `X.counteredBySpecialSkills` -> `X.counteredBySpecialSkills[]`, `target = specialSkill(Y, factionId)`.

If a chunk edits `src/data/characterRelations.ts`, always run:

- `node scripts/normalize-character-relations.mjs`

Before marking that chunk synced, verify:

- `node scripts/normalize-character-relations.mjs --check --report`

Do not store relation text under `relation.description`; keep user-facing text in top-level `description`.
Do not downgrade to partial/placeholder description (e.g. empty string) when newValue provides concrete text.

## Conflict Resolution for Same Scope

If multiple approved actions on the same date touch the same logical relation area:

1. Apply in `created_at ASC` order.
2. Treat later actions as authoritative for overlapping fields.
3. If one action changes relation kind (e.g. `counters` -> `counterEachOther`), ensure the obsolete semantic twin is removed or updated so final graph is not contradictory.
4. If an action path cannot be mapped confidently, mark it as deferred (not synced), report ids, and ask before status writes.

## Core Rules

1. If unspecified, default to year 2026.
2. Never blindly replay action paths into source files. Always map to current structure first.
3. Before patch planning, read src/app/admin/sync-pr/route.ts as the behavioral reference for sync intent and status handling.
4. If the route path changed, locate the active admin sync endpoint first, then continue.
5. If action volume is large, classify based on content into smaller chunks and stop for approval before each chunk.
6. Never update status to "synced" until code edits and validations for that chunk succeed.
7. Use utf-8 encoding.
8. Never mark a chunk as synced when code mapping is unresolved, ambiguous, or intentionally skipped.

## Workflow

### Phase 1: Scope and Discovery

1. Collect candidate actions from game_data_actions from supabase MCP using filters:

- date or date range
- created_by nickname (or empty nickname if applicable)
- status: approved

2. Summarize counts by one or more of:

- date
- creator
- entity_type

3. Build an action inventory table (id, path, op, oldValue, newValue, message). No need to print it.

Completion check:

- You can state exact total actions and grouping dimensions.

### Phase 2: Preflight Classification

Classify each action into one of:

- Direct patchable: maps cleanly to current file structure.
- Refactor-mapped: semantic equivalent exists but path moved.
- Needs decision: ambiguous mapping.

(for smaller batches, skip this step)
For larger batches:

- Create chunk plan first (for example by character, by file, or by message cluster).
- Keep each chunk small enough (typically 5~20 actions) to review quickly.
- Pause after establishing the plan before preceeding to execution.

Chunk checklist template:

- Chunk name
- Action ids included
- Expected files
- Validation plan

Stop here and ask for approval to execute chunk 1.

### Phase 3: Chunk Execution (One by One)

For each approved chunk:

1. Apply code edits only for actions in chunk scope.
2. Check targeted grep/content for changed fields
3. If checks pass:

- mark successfully applied actions as synced

4. If explicit user policy says a subset must not be applied (for example alias-only actions), mark only that subset as rejected.
5. Emit per-chunk report:

- patched count
- skipped/ambiguous count
- their ids (if not too many)

Approval gate:

- Pause after each chunk summary and ask whether to proceed to next chunk.

### Phase 4: Final Reconciliation

1. Re-query statuses for processed scope.
2. Confirm totals:

- synced total
- remaining approved total (should be zero unless intentionally deferred)

## Supabase MCP SQL Templates (Practical)

Use these patterns with mcp_supabase_execute_sql. Replace placeholders first.

Placeholders:

- DATE: e.g. '2026-02-22'
- NICK: creator nickname, e.g. 'SYSTEM-CPYTHON' (or '' for empty nickname)
- IDS: explicit action id list

1. Status distribution for a date and creator

```sql
select g.status, count(*) as cnt
from game_data_actions g
left join users_public_view u on u.id = g.created_by
where date(g.created_at) = DATE
  and coalesce(u.nickname, '') = NICK
group by g.status
order by g.status;
```

2. Pull approved action inventory (id + entry)

```sql
select g.id, g.entity_type, g.status, g.created_at, coalesce(u.nickname, '') as created_by_nickname, g.message, g.entry
from game_data_actions g
left join users_public_view u on u.id = g.created_by
where date(g.created_at) = DATE
  and g.status = 'approved'
  and coalesce(u.nickname, '') = NICK
order by g.created_at asc;
```

3. Mark only selected ids as rejected (policy subset)

```sql
update game_data_actions
set status = 'rejected'
where id in (IDS)
  and status in ('approved', 'synced');
```

4. Mark remaining same-scope approved as synced (excluding rejected ids)

```sql
update game_data_actions g
set status = 'synced'
from users_public_view u
where u.id = g.created_by
  and date(g.created_at) = DATE
  and coalesce(u.nickname, '') = NICK
  and g.status = 'approved'
  and g.id not in (IDS);
```

5. Final verification snapshot

```sql
select status, count(*) as cnt
from game_data_actions g
left join users_public_view u on u.id = g.created_by
where date(g.created_at) = DATE
  and coalesce(u.nickname, '') = NICK
group by status
order by status;
```

6. Verify non-synced residual ids

```sql
select g.id, g.status, g.message, g.entry
from game_data_actions g
left join users_public_view u on u.id = g.created_by
where date(g.created_at) = DATE
  and coalesce(u.nickname, '') = NICK
  and g.status <> 'synced'
order by g.created_at asc;
```

Execution notes:

- Always run inventory query before any status write.
- Prefer id-scoped writes for rejected subset.
- Do not bulk-convert synced to rejected unless user explicitly asks.

## Branching Logic

- If action count <= 10: one chunk is acceptable unless they are very complex.
- If action count > 10: try to chunk unless they are very simple.
- If file encoding/garbling risk is detected: stop and ask permission to recover file with git before continuing.

## Regression and Safety Checks

- Data consistency checks:
  - newValue appears exactly where intended
  - deprecated/old value removed when action semantics require replacement
  - relation entries keep normalized shape: top-level `description`, and `relation` only contains semantic metadata (`kind/subject/target/isMinor`)
- Content checks:
  - new value is reasonable
  - "message" of a set of submitted action is implemented (for example, if several actions have same message saying "修复了牛仔杰瑞同时存在于克制与被克制的bug（改为互有克制）", check whether "counter" relationship is deleted and "counterEachOther" relationship is added. Other unrelated actions as we do not expect "message" to describe everything it does.)
  - if the change only happens at new description fields, ensure the change is appropriate, e.g. no regression in precision or conciseness. If there is a risk of regression, assess its level.

## Status Write Gate (Hard Stop)

Before any `update ... set status = 'synced'`:

1. Ensure every action id in the write set is in the chunk ledger as `patched`.
2. Ensure no id in the write set is `deferred` or `ambiguous`.
3. Re-run targeted grep/read checks for each changed field family.
4. If any check fails, do not write synced; report and resolve first.

## Reporting Format

Use compact, deterministic summaries:

- Scope discovered: total actions and filters used
- Chunk N result: patched X, rejected Y, deferred Z
- Status snapshot: synced A, rejected B, approved C
- Residual risk: any ambiguous mappings, intentionally deferred items, or regressions

## Quick Improvements

- Keep a per-chunk status ledger (ids by synced/rejected/deferred) before issuing status updates.
- If a chunk includes both content changes and policy rejections, report them separately to avoid accidental bulk status writes.
- For repeated action waves on the same date, always re-query current statuses before writing to avoid overwriting manual moderation changes.
