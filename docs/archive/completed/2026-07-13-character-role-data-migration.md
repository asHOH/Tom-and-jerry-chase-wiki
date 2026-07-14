# Character Role Data Migration Plan

## Goal

Replace the current loosely typed role-data integration with a validated public canonical dataset,
migrate all statistic consumers to it, restore ranking links and cooldown behavior, and then remove
superseded character fields.

The implementation order is intentional: establish and validate canonical data, migrate consumers,
restore links, and only then remove legacy fields. Every commit must remain buildable and pass its
relevant tests. The disclosure-chevron cleanup remains isolated from character-role revisions.

The intended data flow is:

```text
Private raw source → public normalizer → tracked public canonical role data → site
```

The raw input may remain in the local working tree and may be inspected locally, but it must not be
tracked again.

## Commit 1: Isolated disclosure-chevron cleanup

Commit: `refactor(ui): reuse disclosure chevron`

- Add a stateless `ChevronDownIcon` to `src/components/icons/CommonIcons.tsx`.
- Replace matching inline down-chevron SVGs across the repository, including the role card, history
  displays, win rates, changelogs, and character selector.
- Keep `expanded` state and conditional `rotate-180` classes in each caller.
- Use `transition-transform motion-reduce:transition-none`.
- Do not introduce a stateful disclosure component.
- Do not mix character-role revisions into this commit.

## Commit 2: Atomically introduce canonical role data and switch its UI

Commit: `feat(character-roles): add canonical role data pipeline`

This commit combines normalization, the canonical domain module, and the component migration so that
there is no committed state where the site expects one role-data shape while receiving another.

### Raw and canonical files

- Add a public TypeScript normalizer under `scripts/` and run it with the repository's existing
  `jiti` dependency. Do not add another TypeScript script runner.
- Accept the raw input path explicitly and write to a fixed tracked canonical JSON path under
  `src/features/character-roles/data/`.
- Remove `src/data/roles.json` from Git tracking without deleting the developer's local copy, and add
  that raw path to `.gitignore` so it cannot appear in future commits accidentally.
- Remove all site imports of the raw JSON. The site must import only the canonical artifact.
- Validate the complete output before replacing the canonical file.
- Serialize deterministically:
  - Playable roles follow the insertion order of the exported character definitions.
  - Remaining roles sort by normalized name using code-point order, without locale-dependent
    comparison.
  - Use stable property order, two-space JSON indentation, and one final newline.

### Canonical representation

Keep the schema concrete rather than using an open-ended “other mechanics” field:

```ts
type RoleType = 'mouse' | 'cat' | 'special';
type PhysicsType = FactionId | 'special';

type CharacterRole = {
  name: string;
  roleType: RoleType; // Normalized raw role category; this is not allegiance
  physicsType: PhysicsType;
  sex: 'male' | 'female' | 'none';

  size: { width: number; height: number };

  runSpeed: number; // 单位长/秒
  jumpSpeed: number; // 单位长/秒
  climbSpeed: number; // 单位长/秒
  visionScale: number;
  gravity: number;

  baseHp: number;
  maxHp: number;
  hpRecovery: number; // Hp/秒

  attack?: number;
  wallDamage: number;
  attackRange?: number;
  attackCooldown: {
    hit: number; // 秒
    miss?: number; // 秒
  };

  pushCheeseSpeed?: number; // %/秒
  initialItem?: string; // Site-facing item identifier
  deformCooldown?: number; // 秒
  shoppingCooldown?: number; // 秒
  shoppingDelay?: number; // 秒
};
```

Use a distinct `RoleType` name even though its values overlap with `FactionId`. A role's faction must
never be inferred from `roleType`; for example, `兔子大表哥` belongs to the mouse faction but has a
different raw role category and cat-like physics.

### Complete raw-to-canonical mapping

| Raw field          | Canonical field or action                                        |
| ------------------ | ---------------------------------------------------------------- |
| `name`             | Normalize into `name`                                            |
| `roleType`         | Map `0/1/2` to `mouse/cat/special`                               |
| `physicsTag`       | Map `1/2/1009` to `mouse/cat/special`                            |
| `sex`              | Map `0/1/2` to `none/male/female`                                |
| `size`             | Parse `width;height` into a numeric object                       |
| `runSpeed`         | `runSpeed`                                                       |
| `jumpSpeed`        | `jumpSpeed` after allowlisted corrections                        |
| `climbSpeed`       | `climbSpeed`                                                     |
| `vision`           | `visionScale`                                                    |
| `gravity`          | `gravity`                                                        |
| `baseHp`           | `baseHp`                                                         |
| `maxHp`            | `maxHp`                                                          |
| `hpRecover`        | `hpRecovery`                                                     |
| `attack`           | `attack`                                                         |
| `attackGoldGate`   | `wallDamage`                                                     |
| `attackRange`      | `attackRange`                                                    |
| `attackCd`         | `attackCooldown.hit`                                             |
| `attackMissCdRate` | Derive `attackCooldown.miss`; do not expose the ratio separately |
| `pushCheese`       | Multiply by 5 into `pushCheeseSpeed`                             |
| `item`             | Map to a site-facing `initialItem` identifier                    |
| `deformCD`         | `deformCooldown`                                                 |
| `buyCD`            | `shoppingCooldown`                                               |
| `buyDelay`         | `shoppingDelay`                                                  |

When calculating miss cooldown, round floating-point noise to at most six decimal places and remove
trailing zeroes before serialization.

### Explicit corrections and exclusions

Corrections must be allowlisted. Do not add a generic fallback that accepts malformed numbers or
unknown punctuation:

- `罗宾汉杰瑞.jumpSpeed`: normalize the known raw value `"1675;1450"` to `1675`. Any other
  nonnumeric jump speed is an error.
- Normalize `表演者▪杰瑞` to the website identifier `表演者•杰瑞`.
- Normalize the escaped raw identifier `\"正气守护\"斯派克` and its site reference to one canonical
  identifier using Chinese quotation marks.
- Explicitly exclude the near-empty `火箭` role record with a documented reason.
- Remove `characterRoleName: '火箭'` from the item definition in the same commit. Preserve all
  existing ordinary item data for `火箭`; its page must no longer render a role-attributes panel.
- Do not use a generic “too few fields” filter that could silently discard future broken records.

### Validation and enforcement

Use one shared schema and validation implementation for the normalizer, audit command, and tests.
Keep it free of React and Next.js dependencies.

Validation must:

- Reject unknown keys, invalid field types, unknown enum codes, and non-finite numbers.
- Require normalized, nonempty, unique names after corrections.
- Require all core properties shown as non-optional in `CharacterRole`.
- Treat omitted optional mechanics as “not applicable,” while adding conditional requirements where
  the domain establishes applicability. In particular, playable cats must have their applicable
  attack fields and playable mice must have their applicable cheese-pushing fields.
- Require negative, nonzero gravity so derived jump height is finite.
- Verify that every playable character and every remaining `characterRoleName` reference resolves.
- Verify that excluded records, including `火箭`, have no remaining `characterRoleName` reference.
- Reject definitions that contain both a legacy character-like representation and
  `characterRoleName`.

Add explicit package scripts such as `normalize:character-roles` and
`validate:character-roles`. Enforcement is fail-fast at every boundary that consumes or produces the
artifact:

- The normalizer refuses to write invalid output.
- CI runs `validate:character-roles` and fails on invalid committed canonical data.
- Every `npm run build*` command runs the audit before Next.js and fails on invalid canonical data.

Build failure is required because canonical role data is a direct build input. Allowing an invalid
artifact to build would require a UI fallback or could produce a broken deployment independently of
CI, both of which conflict with the strict-data goal.

Public tests use synthetic normalizer fixtures and do not require the private raw source.

### Domain module and derived selectors

Create a dedicated `src/features/character-roles/` module containing:

- Canonical schema and types.
- The readonly role collection and name index.
- Strict role lookup with no “未找到角色” rendering fallback.
- Derived selectors.
- UI-independent formatters.
- A typed, exhaustive role-attribute tooltip map. Do not route role attributes through the
  positioning-tag tooltip helper, and do not fall back to returning the label when a tooltip is
  missing.

Calculate jump height once as an integer-valued domain selector:

```ts
const jumpHeight = Math.round(jumpSpeed ** 2 / (2 * Math.abs(gravity)));
```

Detail pages, games, comparisons, tie detection, and rankings must all use this same integer. This
ensures that displayed values and ranking behavior agree.

Playable faction remains sourced from `Character.factionId`. Consumers must join a character to its
strictly resolved role by character ID; they must not derive faction from `roleType` or
`physicsType`.

### Component migration

Refactor `CharacterRoleAttributesCard` in this same commit to:

- Use a functional component with `useState`.
- Consume canonical role data through the strict domain module.
- Receive the character faction when the presentation context needs faction-dependent behavior.
- Keep attribute definitions declarative.
- Avoid `unknown` values and all `未知` enum fallbacks.
- Remove raw size, push-speed, item, and cooldown conversion logic.
- Add a visible keyboard focus style.

Use explicit presentation contexts:

```ts
type CharacterRoleAttributesContext = 'character' | 'object';
```

On character detail pages:

- Hide role type.
- Hide physics type.
- Rename `视野参数` to `视野缩放` and update its typed tooltip entry at the same time.
- Determine faction gravity uniformity from playable characters using the integer-displayed gravity
  value. Hide gravity when that displayed value is uniform for the faction; show it if a future
  meaningful difference produces different displayed values.
- Use explicit collapsed-summary key lists rather than the first six non-null attributes:
  - Character context: sex, English name, Hp maximum, Hp recovery, run speed, and derived jump
    height.
  - Object context: role type, physics type, Hp maximum, Hp recovery, run speed, and attack
    cooldown.
  - Omit a summary field when that mechanic is not applicable; do not substitute an unrelated field
    merely to keep six rows.

Object, entity, and fixture contexts may continue showing role type, physics type, and gravity.

Update the `CharacterDetails` test in this commit: use a real resolvable character fixture or mock the
role boundary deliberately, remove the stale `CharacterAttributesSection` mock, and add direct tests
for canonical formatting, strict lookup, folding, and accessibility.

## Commit 3: Migrate rankings to canonical selectors

Commit: `refactor(character-roles): migrate rankings`

Migrate rankings before restoring links so that links never lead to rankings backed by contradictory
legacy data.

Change ranking properties from direct `Character` property access to descriptors backed by canonical
selectors:

```ts
type PropertyInfo = {
  key: RankableProperty;
  getValue: (role: CharacterRole) => number | undefined;
  formatValue: (value: number) => string;
  // Label, faction restriction, sort direction, and unit...
};
```

Ranking functions must first join each playable `Character` with its role, use
`Character.factionId` for faction filtering, and then call the descriptor selector.

Keep existing route keys as stable public identifiers after their backing `CharacterDefinition`
fields disappear:

| Existing route key     | Canonical source                     |
| ---------------------- | ------------------------------------ |
| `maxHp`                | `maxHp`                              |
| `attackBoost`          | `attack`                             |
| `hpRecovery`           | `hpRecovery`                         |
| `moveSpeed`            | `runSpeed`                           |
| `jumpHeight`           | Integer derived jump-height selector |
| `clawKnifeCdHit`       | `attackCooldown.hit`                 |
| `clawKnifeCdUnhit`     | `attackCooldown.miss`                |
| `clawKnifeRange`       | `attackRange`                        |
| `cheesePushSpeed`      | `pushCheeseSpeed`                    |
| `wallCrackDamageBoost` | `wallDamage`                         |

Before deleting legacy fields, generate a migration parity report:

- All directly equivalent non-jump fields must match unless an explicit, reviewed correction is
  allowlisted.
- Jump-height changes are expected because old values were manually measured; record the old and
  newly derived integer values.
- Confirm that rank ordering and ties use the same integer shown to users.
- Treat unexplained differences as migration failures rather than silently accepting the canonical
  value.

## Commit 4: Migrate game consumers

Commit: `refactor(games): use canonical character role stats`

Migrate the bounded game-facing consumers:

- Stat Showdown.
- Guess Character.
- Playstyle Quiz gender display.
- Shared game stat labels, sort direction, and comparison behavior.

Tests must cover missing non-applicable mechanics, lower-is-better cooldowns, integer jump-height ties,
and faction restrictions.

## Commit 5: Migrate text and API consumers

Commit: `refactor(character-roles): migrate text and api consumers`

Migrate the remaining non-ranking consumers:

- Damage and text-tooltip calculations.
- Tooltip placeholders that currently read covered fields from `CharacterDefinition`.
- Chat/API role-data schemas, serialization, comments, and examples.
- Character data-validation tests.
- Any remaining covered-field references found by a final `rg` audit.

Keep `specialClawKnifeCdHit` and `specialClawKnifeCdUnhit` on `CharacterDefinition` and available to
the existing skill-text placeholders. They are skill-specific exceptions and are not canonical role
fields in this migration.

## Commit 6: Restore ranking links and finalize cooldown UI

Commit: `feat(character-roles): restore attribute ranking links`

After rankings use canonical selectors:

- Link every compatible displayed value to its existing ranking route.
- Include `?faction=cat|mouse`, sourced from `Character.factionId`, on character-page ranking links.
- Link derived jump height, rather than jump speed, to `/ranks/jumpHeight/`.
- Render ordinary attack cooldowns in the existing order as
  `未命中 Y 秒 / 命中 X 秒` when miss cooldown exists.
- Render only `命中 X 秒` when miss cooldown is not applicable.
- Preserve the old special-cooldown convention for 苏蕊 by placing the special values in parentheses
  beside the corresponding ordinary values:
  `未命中 Y（特殊 T）秒 / 命中 X（特殊 S）秒`.
- Link ordinary hit and miss values independently to their corresponding ranking pages. The
  parenthesized skill-specific cooldowns are not ranking links.
- Do not display `attackMissCdRate` itself.
- Verify that the explicit collapsed summary remains useful after context-specific visibility rules.

## Commit 7: Remove superseded character data and dead UI

Commit: `refactor(characters): remove legacy role attributes`

Only after every consumer has migrated and the parity report has no unexplained differences, remove
these covered fields from `CharacterDefinition` and the character definition files:

- `maxHp`
- `attackBoost`
- `hpRecovery`
- `moveSpeed`
- `jumpHeight`
- `clawKnifeCdHit`
- `clawKnifeCdUnhit`
- `clawKnifeRange`
- `initialItem`
- `storePurchaseTime`
- `cheesePushSpeed`
- `wallCrackDamageBoost`
- `gender`

Retain for now:

- `specialClawKnifeCdHit`
- `specialClawKnifeCdUnhit`
- `EnglishName`
- Non-stat metadata, skills, positioning, recommendations, and aliases.

Delete unused UI after migration:

- `CharacterAttributesSection`
- `AttributeDisplay`
- Obsolete barrel exports.
- Stale tests and mocks not already corrected with their owning change.

Leave the remaining legacy `entityAttributesAsCharacter` records in place until canonical source
data exists for them. Keep validation that prevents an entry from using both that legacy
representation and `characterRoleName`.

## Required final coverage

Each commit must include tests proportional to its changes. Final coverage must include:

- Every raw-to-canonical field mapping.
- Explicit corrections, deterministic serialization, and the `火箭` exclusion.
- Invalid enums, malformed sizes, unexpected nonnumeric values, duplicate normalized names, missing
  core fields, conditional required fields, and broken references.
- Optional miss-cooldown behavior and floating-point normalization.
- Strict lookup with no user-facing missing-role fallback.
- Integer jump-height calculation, display, sorting, and tie behavior.
- Character-faction joins that never infer allegiance from role or physics type.
- Context-specific hidden fields and gravity visibility policy.
- Typed tooltip completeness, including `视野缩放`.
- Collapsed and expanded state, `aria-expanded`, focus visibility, and reduced motion.
- Ranking link destinations and faction query parameters.
- Ordinary and 苏蕊 special cooldown presentation.
- Resolution of every playable character and remaining cross-interface role reference.
- Rejection of any definition that combines legacy and canonical role representations.
- A clean parity report and an assertion that no covered legacy statistic remains after Commit 7.
- An assertion that the raw role path is ignored and absent from tracked files.

## Final verification

```powershell
npm run validate:character-roles
npm run lint
npm run type-check
npm test
npm run build:skip-images
```

All commands must pass before the migration is considered complete.
