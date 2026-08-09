# TextWithHoverTooltips Parsing Plan

## Status

- Date: 2026-08-09
- Last revised: 2026-08-10
- State: Phase 1 and Phase 2 complete
- Scope: Inline parsing and rendering performed by `TextWithHoverTooltips` and its helpers
- Production impact: User-visible link and tooltip affordances; no data or API changes

## Problem

`TextWithHoverTooltips` recognizes wiki links, calculated values, hover tooltips, highlights, and
inline classes through several successive string-processing passes. Those passes stop composing
once one of them turns text into a React element.

Three confirmed behaviors follow:

1. `preprocessText` skips all automatic name linking when the input contains any `{...}` or
   `《...》` marker. In `布奇造成{25*}伤害`, the damage is formatted but `布奇` remains
   indistinguishable from ordinary text.
2. Markdown-highlighted content becomes an opaque React element before link parsing. For example,
   `**布奇**` may be preprocessed to `**{布奇}**`, after which the braces can be displayed literally
   instead of producing a highlighted link.
3. Bracket tooltips inside highlights are not recognized. `**[短按](说明)**` remains literal because
   bracket tooltips are split only outside markdown-highlight tokens.

The navigation and tooltip components already provide underlined and dotted affordances. The defect
is that affected text never reaches those semantic renderers.

## Target parsing specification

Parsing must obey these rules:

- Explicit markup protects only its own source range. Its presence must not disable automatic name
  linking in surrounding plain text.
- Recognized names are automatically linked only in eligible plain-text ranges. Existing
  current-character exclusions and the automatic-link blacklist remain unchanged.
- Explicitly marked names are not wrapped a second time.
- Presentation markup may contain semantic markup. Highlights must preserve links, bracket
  tooltips, knowledge-card tags, calculated damage, and inline classes within their content.
- Navigation links retain a visible link affordance, ordinary tooltip triggers retain a dotted
  affordance, and combining either with a highlight must not remove that semantic formatting.
- Semantic recognition uses logical source adjacency across presentation boundaries. A calculated
  damage expression owns an immediately following `伤害` or `点伤害` suffix even when the suffix is
  just outside a highlight. The renderer emits that suffix exactly once, with the calculated value,
  and removes the consumed source suffix.
- Successfully parsed delimiters are not displayed. Malformed or unsupported markup falls back to
  literal text without losing content or throwing.
- Adding unrelated formatting elsewhere in a sentence must not change whether an otherwise eligible
  name is linked.

For example, while viewing a character other than `布奇`:

```text
Input:  布奇使用**{横冲直撞}**造成{25*}伤害
Target: 布奇 is linked; 横冲直撞 is highlighted and linked; 25伤害 keeps its calculation tooltip

Input:  **[短按](说明)**后造成**{25*}**伤害
Target: 短按 is highlighted and keeps its tooltip; calculated 25伤害 is emitted once
```

## Phase 1: Correct the confirmed behavior

Phase 1 is the required fix.

1. Replace the all-or-nothing early return in `preprocessText` with range-aware processing. Preserve
   complete `{...}` and `《...》` regions, and run automatic name wrapping on the plain ranges around
   them.
2. Replace opaque highlight tokens with a small decoration-aware token plan. Continue recognizing
   bracket tooltips and the existing semantic markup within highlighted ranges, then apply the
   highlight to the rendered semantic content. Do not pass isolated highlight strings directly to
   `renderTextWithTooltips`, because that loses bracket-tooltip parsing and source context.
3. Preserve logical adjacency between neighboring tokens. When calculated damage consumes an
   immediately following `伤害` or `点伤害`, carry that ownership across a highlight boundary so the
   suffix is neither duplicated nor dropped.
4. Add focused helper and component coverage for mixed automatic links, explicit markup,
   highlighted bracket tooltips, knowledge-card tags, calculated damage with its suffix inside and
   immediately outside a highlight, current-character exclusions, and malformed input.

Phase 1 is complete when the confirmed examples satisfy the target specification without changing
the established rendering of existing standalone markup.

Implementation result: automatic links are now applied around protected markup, highlights carry a
decoration flag over semantic text and bracket-tooltip tokens, and calculated damage claims an
adjacent external suffix before rendering.

## Phase 2: Parser consolidation

Phase 2 was explicitly requested after Phase 1. Its scope remains limited to consolidating the
project's existing inline syntax; it does not introduce a general Markdown grammar.

The remaining parsing flow tokenizes supported inline constructs before React elements are created
and renders textual content through one semantic path. It extends the flat, decoration-aware token
model from Phase 1 without adding arbitrary recursive syntax nodes.

The consolidation uses this explicit parsing order:

1. replace buff identifiers;
2. identify supported explicit containers;
3. apply automatic linking to eligible plain-text ranges;
4. render semantic constructs; and
5. apply visual-only coloring to remaining text.

Implementation result: outer highlight and bracket-tooltip containers are identified before
automatic linking; plain, inline-class, and explicit `{...}`/`《...》` content is converted to pure
tokens; explicit content normalization and damage-suffix ownership are decided before rendering;
and the renderer consumes that token plan without reparsing rendered React elements.

## Validation

Repository formatting, lint, and type-checking pass. Focused parser and component coverage passes,
including automatic linking after container recognition, semantic markup nested in bracket
tooltips, inline classes inside highlights, malformed input, and damage-suffix ownership. The full
Jest suite passes.
