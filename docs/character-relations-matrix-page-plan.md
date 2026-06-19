# Character Relations Matrix Page Plan

## Status

Draft spec for a new public page at `/relations/`.

This plan records confirmed behavior, implementation direction, and open decisions for a page
showing all character relations as a compact matrix.

## Goal

Create a public, mobile-first page titled `角色关系` that displays character relation data in a
table. The table should let readers choose the character faction used as row subjects and the
target category used as columns, then quickly scan major and minor relations by color.

## Confirmed Product Spec

- Route: `/relations/`.
- Page title: `角色关系`.
- Visibility: public.
- Rendering model: static-first. The page should be compatible with `dynamic = 'force-static'`.
- Navigation: add `/relations/` under the `角色` navigation group because the primary subject is
  character relationships.
- Sitemap: include `/relations/` in `src/app/sitemap.ts`.
- SEO description:
  `查看猫和老鼠手游角色间，及角色与知识卡、特技、地图、模式之间的克制和协作关系。`
- Data source: static TypeScript relation data from `src/data/characterRelations.ts`, composed from
  focused files under `src/data/characterRelationData/`.
- Source-file shape: each matrix target category should map to one focused relation data file, or
  to the relevant half of a focused file, under `src/data/characterRelationData/`. This can be seen as a consistency check, not a primary target.
- Relation source: use canonical `characterRelationTraits` from `src/data/characterRelations.ts`.
  Do not depend on character-detail legacy overlay projection from `getCharacterRelation()` unless
  a future requirement explicitly asks for that parity.
- Relation authoring and data validation are already handled by
  `src/data/characterRelationValidation.ts` and
  `src/data/characterRelationValidation.test.ts`.
- The page is read-only. It is not an edit surface.

## Axes

Rows are always characters and represent the relation subject.

Row faction selector:

- `mouse`
- `cat`

Column category selector:

- `mouse`
- `cat`
- `knowledge card`
- `special skill`
- `map`
- `mode`

Legal column categories depend on the selected row faction:

- Row `mouse`: `mouse`, `cat`, `knowledge card`, `special skill`, `map`, `mode`.
- Row `cat`: `mouse`, `knowledge card`, `special skill`, `map`, `mode`.
- Row `cat` with column `cat` is not legal.
- Row `mouse` with column `mouse` is legal because collaborator relations only happen between
  mice.

Defaults:

- Row faction: `mouse`.
- Column category: `cat`.
- If a row-faction switch makes the selected column category illegal, use the faction-opposite
  character category as fallback:
  - row `mouse` falls back to column `cat`.
  - row `cat` falls back to column `mouse`.
- Selector state should stay local to the page. Do not sync the selected row faction or column
  category into URL query params.

Column category filtering:

- Knowledge cards must only include the opposite faction's cards:
  - mouse rows show cat knowledge cards.
  - cat rows show mouse knowledge cards.
- Special skills follow the same opposite-faction bound:
  - mouse rows show cat special skills.
  - cat rows show mouse special skills.
- Maps and modes are global.

Ordering:

- Characters should follow `mouseCharacterIds` and `catCharacterIds` from
  `src/features/characters/data/characterMetadata.ts`.
- Other column categories should use existing data order for now.
- Do not implement search or sorting controls yet, but keep row/column derivation centralized so
  future search or sorting can be added without rewriting cell lookup.

## Relation Semantics

The row is always the subject. A cell describes the relation from row subject to column target.

Display relation types:

- `collaborator`: green.
- `counter`: blue.
- `counteredBy`: red.
- `counterEachOther`: yellow/amber.

Canonical relation-kind mapping:

- `collaborators` -> collaborator.
- `counters`, `countersKnowledgeCards`, `countersSpecialSkills` -> counter.
- `counteredBy`, `counteredByKnowledgeCards`, `counteredBySpecialSkills` -> counteredBy.
- `counterEachOther` -> counterEachOther.
- `advantageMaps`, `advantageModes` -> counter.
- `disadvantageMaps`, `disadvantageModes` -> counteredBy.

Relation constraints already confirmed by validation:

- Collaborator relations must connect two mouse characters.
- Counter, counteredBy, and counterEachOther character relations must be cross-faction.
- Knowledge-card counter relations must be cross-faction.
- Special-skill counter relations must be cross-faction.
- `counterEachOther` is symmetric.
- `collaborators` is symmetric.
- `counters` and `counteredBy` are inverse semantics.
- Duplicate relation edges and contradictory character-character edges are forbidden at data level.
- Multiple edges in one table cell should therefore be treated as impossible.

## Cell Rendering

- Empty cells are blank.
- Major relation:
  - Fill the full cell with the relation color.
  - No text inside the cell by default.
- Minor relation:
  - Do not fill the cell background.
  - Show a large centered dot in the relation color.
- Use colors consistent with the current character-detail relation panel:
  - green for collaborator.
  - blue for counter.
  - red for counteredBy.
  - amber/yellow for counterEachOther.
- `CharacterRelationPanel.tsx` currently defines local `relationThemeClasses`; implementation
  should either extract a shared relation color map or duplicate only the minimal matrix classes
  with the same Tailwind color families.

## Tooltips

- Only non-empty cells need tooltips.
- Use `src/components/ui/Tooltip.tsx`.
- Desktop: hover opens tooltip.
- Mobile: click or touch interaction should reveal tooltip using the existing tooltip behavior.
- Tooltip content should use the relation description from `characterRelations.ts`.
- Tooltip prefix:
  - `克制：` for counter.
  - `被克制：` for counteredBy.
  - `互克：` for counterEachOther.
  - `协作：` for collaborator.

## Header And Link Behavior

- Row titles and column titles should be text-only links to their detail pages.
- Link targets:
  - Characters: `/characters/${encodeURIComponent(characterId)}`
  - Knowledge cards: `/cards/${encodeURIComponent(cardId)}`
  - Special skills: `/special-skills/${factionId}/${encodeURIComponent(skillId)}`
  - Maps: `/maps/${encodeURIComponent(mapId)}`
  - Modes: `/modes/${encodeURIComponent(modeId)}`
- Column header labels should be compact:
  - Chinese names up to 5 characters should be split into one character per line.
  - Chinese names longer than 5 characters may use smaller text and/or allow two Chinese
    characters per line without widening the column.
  - Latin or Roman numeral chunks should stay together, for example `雪夜古堡III` should keep
    `III` as one chunk.
  - Overflow should be hidden rather than widening the column.
- Row header labels should stay horizontal and single-line where possible.
  - For names longer than 5 characters, shrink text and/or spacing.
  - Avoid wrapping row names into multiple lines unless there is no viable compact fallback.

## Layout

- The matrix should scroll horizontally and vertically when needed, on both mobile and desktop.
- Expected table scale is generally 30 to 50 rows or columns.
- The top header row should be sticky.
- The left row-title column should be sticky.
- The top-left corner cell should remain readable when both sticky axes overlap.
- Include a small inline legend above the table showing the four relation colors and the
  major/minor encoding.
- Cell dimensions should be compact and stable.
- Text can be slightly smaller than the site's normal body text to preserve density.
- Header dimensions should be constrained so hovering, tooltip triggers, or dynamic labels do not
  resize the table.
- Text should not overlap neighboring headers or cells.
- No dedicated empty state is required; legal row/category combinations are expected to have rows
  and columns.
- The design should be dense and utilitarian, not a landing-page layout.

## Suggested Implementation Structure

Add a focused feature module rather than mixing the matrix into the character-detail relation UI:

- `src/app/(main)/relations/page.tsx`
  - Static metadata.
  - `dynamic = 'force-static'`.
  - Renders the client matrix page.
- `src/app/(main)/relations/RelationsClient.tsx`
  - Client state for row faction and column category selectors.
  - Renders controls, legend, and matrix.
- `src/features/character-relations/matrix/`
  - `CharacterRelationsMatrix.tsx`
  - `relationMatrixViewModel.ts`
  - `relationMatrixViewModel.test.ts`
  - Optional small components for selectors, headers, cells, and legend.

The view-model should be pure and responsible for:

- Building row entities from selected row faction.
- Building legal column-category options.
- Building column entities from selected category and row faction.
- Normalizing relation kinds into the four display relation types.
- Resolving symmetric and inverse character-character relations.
- Mapping map/mode advantage relations into counter/counteredBy display semantics.
- Producing a stable cell lookup keyed by row item and column item.

Implementation should use static relation traits from `src/data/characterRelations.ts` as the
canonical source. The existing `getCharacterRelation()` read model in
`src/features/characters/utils/relationReadModel.ts` is useful reference material, but the matrix
should not depend on character-detail edit overlay behavior.

## Testing Plan

Add focused tests for the pure matrix view-model:

- Legal column categories for mouse rows and cat rows.
- Default row/column selection.
- Mouse-mouse collaborator lookup.
- Cross-faction character counter, counteredBy, and counterEachOther lookup.
- Inverse character relation lookup, for example `A counters B` displays `B counteredBy A`.
- Knowledge-card target filtering by opposite faction.
- Special-skill target filtering by opposite faction.
- Map/mode `advantage*` display as counter.
- Map/mode `disadvantage*` display as counteredBy.
- Minor relation marker data is preserved from `isMinor`.
- Cell collision handling should fail loudly in tests even though validation should prevent it.

Component tests are optional at first, but useful if the layout component grows:

- Empty cells render blank.
- Major cells render full-cell color classes.
- Minor cells render a centered dot.
- Non-empty cells include tooltip content.
- Headers render links.

## Important Files Checked

- `src/data/characterRelations.ts`
  - Exports `characterRelationTraits` from split relation data and validates relation data before
    building the default map.
- `src/data/characterRelationData/index.ts`
  - Confirms relation groups are split into character counters, character collaborators,
    knowledge cards, maps, modes, and special skills.
- `src/data/characterRelationValidation.ts`
  - Confirms collaborator, cross-faction counter, duplicate, inverse, and symmetric validation.
  - Does not validate map/mode faction bounds because maps and modes are global relation targets.
- `src/data/characterRelationValidation.test.ts`
  - Confirms existing tests cover duplicate, contradictory, mirrored, collaborator, same-faction
    character, knowledge-card, and special-skill errors.
- `src/data/types.ts`
  - Confirms `TraitRelationKind`, `TraitRelation`, and `SingleItem` shapes.
  - `SingleItem.factionId` is available for special-skill disambiguation.
- `src/features/characters/utils/relationReadModel.ts`
  - Confirms existing character detail pages project inverse character relations and map relation
    arrays from shared relation traits.
  - Currently no legacy relation arrays were found in character data, but the read model still
    supports them.
- `src/features/shared/traits/relationIndex.ts`
  - Confirms an existing static relation index by subject, target, and kind.
- `src/features/characters/components/character-detail/character-relations/CharacterRelationDisplay.tsx`
  - Confirms current relation section colors and map/mode grouping semantics.
- `src/features/characters/components/character-detail/character-relations/CharacterRelationPanel.tsx`
  - Confirms existing relation color families: blue, amber, red, green.
- `src/components/ui/Tooltip.tsx`
  - Confirms tooltip supports hover and non-hover interaction behavior.
- `src/constants/navigation.ts`
  - Confirms primary navigation and tool navigation are explicit lists.
- `src/app/sitemap.ts`
  - Confirms sitemap entries are manually enumerated for major index pages and detail pages.

## Undetermined Decisions

- Color exactness:
  - Existing detail UI uses Tailwind color families rather than exported semantic tokens.
  - Decide during implementation whether to extract shared relation color tokens or keep local
    classes in the matrix.
