---
name: game-action-patching
description: 'Patch approved game_data_actions into character relation/data files.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching

## Goal

Safely patch approved game_data_actions into code, verify, and update their statuses to synced or
ejected.

## Target Files

1. **Primary**: src/features/characters/data/\*Characters.ts (character skills, aliases, descriptions, positioning tags, allocations, special skills), src/data/characterRelations.ts (Cross-character/mode/map/card relation graph like counter/collaborator/advantage/disadvantage)
2. **Secondary**: src/features/entities/data/_, src/features/special-skills/data/_, etc.
   _Heuristic_: Prefer feature-local over generic files. Ask if ambiguous.

## Relation Mapping (src/data/characterRelations.ts)

| Action Path                 | Target kind                               | subject | target                         |
| --------------------------- | ----------------------------------------- | ------- | ------------------------------ |
| X.counters                  | counters                                  | X       | Y                              |
| X.counteredBy               | counteredBy                               | X       | Y                              |
| X.counterEachOther          | counterEachOther                          | X       | Y                              |
| X.advantageMaps             | advantageMaps                             | X       | map                            |
| X.disadvantageMaps          | disadvantageMaps                          | X       | map                            |
| X.advantageModes            | advantageModes                            | X       | mode                           |
| X.disadvantageModes         | disadvantageModes                         | X       | mode                           |
| X.counteredBy[Cards/Skills] | counteredBy[KnowledgeCards/SpecialSkills] | X       | [card/skill] (needs factionId) |

- **Text**: Put user text in top-level description.
- **No-op**: Don't invert equivalent counters/counteredBy or reorder collaborators unless the kind or text inherently changed.
- **Indices**: Treat 0, 1 literally. Defer if oldValue mismatches.

## Core Rules & Conflict Resolution

1. **Conflicts**: 1. Process created_at ASC 2. Later overlaps win 3. Remove obsolete twins if relation changes 4. Defer ambiguities.
2. **Env**: Year: 2026. TZ: Beijing (UTC+8). Encoding: UTF-8 (stop if garbled).
3. **Git**: Branch must be data-sync. Run git merge develop first.
4. **Execution**: Map to current structure; do not blindly replay paths. Chunk if >10 actions.
5. **Status**: Never set synced if code edit/check fails, mapping is fuzzy, or skipped.

## Workflow

1. **Discovery**: Query pproved actions via Supabase MCP.
2. **Classify**: Map or Defer. For large sets, present chunk plan and wait for approval.
3. **Apply & Verify**: Edit code. Run targeted grep/read checks. Sync status only if all flattened updates for a row succeeded. Pause between chunks.
4. **Finalize**: Re-query statuses. Summarize (Synced, Deferred/Remaining) for the PR.

## Supabase MCP Fallback (If not exposed)

- Use local JS client over NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
- Convert Beijing dates to UTC ranges.
- Write updates by specific id.

## Safety Gates

- Check newValue placement and schema shape.
- Verify message intent (e.g. relation added and old deleted).
- Check
  pm run report:character-relations if modifying relations.
