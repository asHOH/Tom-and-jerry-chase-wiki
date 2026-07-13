# Character Role Attributes Card Regression Fix Plan

## Goal

Restore the confirmed character-page attribute behavior without changing the canonical role-data
pipeline. Keep the work in two reviewable commits: first resolve low-risk data, unit-format, and stale
test chores; then change the card's faction-aware display behavior and cooldown presentation.

The generated `src/features/character-roles/data/characterRoles.json`, its normalizer, and its schema
remain unchanged. Canonical role data continues to retain normalized raw values; the card decides
which values are applicable and useful in playable-character context.

## Step 1: Low-risk data, unit, and test cleanup

Commit: `fix(character-roles): align character metadata and timing units`

This step should not change faction visibility or the card's attribute-selection logic.

### Character metadata

- Set `朝圣者泰菲.EnglishName` to `Pilgrim Tuffy` in
  `src/features/characters/data/mouseCharacters.ts`.
- Add a small data-level regression assertion for the corrected English name. Prefer a focused
  co-located character-data test rather than coupling the assertion to card rendering.

### Timing units

- Change `formatCharacterRoleAttackCooldown` to use `s` instead of `秒`.
- Update its unit tests for both hit-only and hit/miss cooldowns.
- Update existing card-test expectations from `秒` to `s`. Natural-language tooltip prose such as
  “每秒恢复” remains Chinese; only displayed units use `s`.

### Confirmed intended card behavior

- Repair the existing collapsed-summary test so it reflects the confirmed behavior:
  - `性别` and `英文名` are hidden before expansion and visible after expansion.
  - Raw `跳跃速度` remains the displayed character summary field; do not restore derived
    `跳跃高度` or its ranking link.
- Keep these expectation-only changes separate from the faction-visibility implementation in Step 2.

### Step 1 verification

Run:

```powershell
npm test -- src/features/character-roles/selectors.test.ts --runInBand
npm test -- src/features/character-roles/components/CharacterRoleAttributesCard.test.tsx --runInBand
npm run lint
npm run type-check
```

The relevant tests must be green before starting Step 2.

## Step 2: Restore character-context applicability and presentation

Commit: `fix(character-roles): restore faction-aware attribute display`

Confine the production change primarily to
`src/features/character-roles/components/CharacterRoleAttributesCard.tsx`. Do not add a shared
applicability abstraction or change generated canonical data for this fix.

### Attribute visibility

Make `createAttributeItems` account for `context` and, for character context, `factionId`. Preserve
the existing field-presence behavior for object context.

For playable mice:

- Show `攻击力`, including a legitimate value of zero.
- Show `破坏力` and `推速` when present.
- Hide `爪刀范围`, `爪刀CD`, `初始道具`, and `购物到货时间`.

For playable cats:

- Show `爪刀范围` and `爪刀CD`.
- Show `攻击力` only when it is defined and nonzero.
- Show `初始道具` only when it is defined and is not the default `老鼠夹`.
- Show `购物到货时间` when present.
- Hide `破坏力` and `推速`.

Keep other currently supported attributes, expansion behavior, ranking links, and character/object
context differences unchanged.

### Cat attack emphasis

- Restore the amber emphasis on the cat `攻击力` row when that row is visible.
- Keep the numeric value's existing ranking link and numeric coloring behavior.
- Do not reintroduce edit-mode behavior.

### Claw-knife cooldown presentation

- Restore the compact ordinary order: `<未命中> / <命中> s`.
- When special cooldowns exist, render them beside the matching ordinary values in parentheses, for
  example `4.9 (4) / 7 (8) s`.
- Keep the two ordinary values linked independently to their existing cat ranking routes.
- Keep special cooldown values unlinked.
- Do not restore the obsolete five-visible-row `col-span-2` heuristic. Verify mobile wrapping with the
  compact format and only add a layout rule if an actual overflow remains.

### Regression tests

Expand `CharacterRoleAttributesCard.test.tsx` with explicit label and value assertions:

- `汤姆`: shows cat cooldown and shopping time; hides zero attack, wall damage, push speed, and the
  default mouse trap.
- `布奇`: shows emphasized nonzero attack; its numeric value retains the cat attack ranking link.
- `苏蕊`: shows the non-default initial item and exact special cooldown formatting; ordinary cooldown
  values remain the only cooldown links.
- `杰瑞`: shows mouse attack, wall damage, and push speed; hides claw range, claw cooldown, initial
  item, and shopping time.
- `盔甲人` in object context: continues showing its applicable hit-only cooldown, proving that
  character faction filtering does not prune object attributes.

Prefer assertions on visible labels and link destinations over snapshots.

### Step 2 verification

Run:

```powershell
npm test -- src/features/character-roles/components/CharacterRoleAttributesCard.test.tsx --runInBand
npm run lint
npm run type-check
npm test
```

## Non-goals

- Do not edit `characterRoles.json` manually or change raw-role normalization.
- Do not make `attackCooldown`, `wallDamage`, or other canonical fields optional.
- Do not introduce a shared faction-applicability selector for a single component.
- Do not restore removed edit-mode support.
- Do not restore `性别`, `英文名`, or derived jump height to the collapsed summary.
