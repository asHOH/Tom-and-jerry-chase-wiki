---
name: game-action-patching
description: 'Patch approved game_data_actions into character relation/data files.'
argument-hint: 'Date range, actor filter, status policy'
user-invocable: true
---

# Game Action Patching

## Goal

Safely patch approved game_data_actions into code, verify, and set synced; defer/reject the rest.

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
- **Equivalent inverse preservation**: If current code already represents `X.counteredBy Y`
  as `Y.counters X`, or `X.counters Y` as `Y.counteredBy X`, keep the existing
  orientation. Apply only material field changes such as `description` or `isMinor`; if no
  material field changed, treat it as a no-op and the row can still be synced after verification.
- **No-op**: Don't reorder collaborators or rewrite equivalent relations when the represented edge and material fields are unchanged.
- **Duplicate cleanup**: If an action removes a redundant edge that is already covered by another relation, remove only the redundant edge. Do not rewrite the other one.
- **Indices**: Treat 0, 1 literally. Defer if oldValue mismatches.

## Core Rules & Conflict Resolution

1. **Conflicts**: Process created_at ASC; same timestamp parent paths before child paths; child/later overlaps win; remove obsolete twins; defer ambiguities.
2. **Env**: Year: 2026. TZ: Beijing (UTC+8). Source files are UTF-8. Chinese text may display as mojibake in Windows PowerShell or agent terminal output when UTF-8 bytes are decoded with a legacy code page. Treat terminal mojibake from `Get-Content`, `rg`, or command output as a display issue unless file bytes, the editor, or browser output prove corruption. Do not "fix" Chinese strings solely because terminal output rendered them incorrectly. In inline scripts, avoid raw Chinese literals; use Unicode escapes, IDs, or DB/file values.
3. **Git**: Branch must be data-sync. Run git merge develop first.
4. **Execution**: Map to current structure; do not blindly replay paths. Chunk if >10 actions.
5. **Status**: Valid statuses: pending, approved, rejected, synced. Never set synced if code edit/check fails, mapping is fuzzy, or skipped.

## Workflow

1. **Discovery**: Query approved actions via Supabase MCP.
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
- Check `npm run report:character-relations` if modifying relations.
- For relation-only chunks, targeted grep/read checks plus `npm run report:character-relations`
  are sufficient, unless shared code, validation logic, or non-relation data files changed.
