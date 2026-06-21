/**
 * Skill effect extraction and anonymization for the Guess Character game.
 *
 * Uses buff descriptions (via singleItemOwnbuffs) as the skill clue source.
 * Strips wiki markup and replaces Chinese-quoted text (…) with
 * numbered placeholders (#1, #2, …) — same quoted text gets the same
 * placeholder across all skills.
 */
import singleItemOwnbuffs from '@/lib/singleItemOwnbuffs';
import type { Buff, SingleItem } from '@/data/types';

// Use a more permissive type that accepts both readonly (Valtio snapshot) and mutable records
type CharacterLike = {
  id: string;
  factionId?: string;
  aliases?: readonly string[] | string[];
  skills?: readonly {
    name: string;
    aliases?: readonly string[] | string[];
    type: string;
    description?: string;
    detailedDescription?: string;
    skillLevels?: readonly {
      level: number;
      description?: string;
      detailedDescription?: string;
      cooldown?: number;
    }[];
  }[];
  gender?: 'male' | 'female' | undefined;
};

/** A single anonymized skill clue */
export type SkillClue = {
  /** Index of this skill in the character's skill array (0-based) */
  skillIndex: number;
  /** Skill type: 'active' | 'weapon1' | 'weapon2' | 'passive' */
  skillType: string;
  /** Anonymized effect text for display */
  anonymizedText: string;
  /** Map from placeholder → real name (for debugging / admin display) */
  placeholderMap: Record<string, string>;
};

// Marker character for internal text processing. U+FFFF is a Unicode
// non-character — guaranteed never to appear in game data. Differences
// from \x00: printable in some contexts, not a control character so it
// doesn't trigger ESLint no-control-regex.
const M = '￿';
// Regex-safe form: ￿ as one char class-safe code unit
const MR = '\\uFFFF';

/**
 * Strip status-mechanic clauses from buff description text.
 *
 * Removes clauses that describe status-immunity, status-clearing, and
 * status-group mechanics — these are game-engine details that don't help
 * players identify a character.
 *
 * Applied after `{…}` wiki markup has been stripped but before Chinese-quote
 * extraction, so the text still has `[…](tooltip)` wiki tooltips and
 * Chinese quotation marks `` … '' intact.
 */
export function stripStatusClauses(text: string): string {
  // Phase A: wiki-tooltip patterns ([…](…) format)
  text = text.replace(/可被\[免疫\]\([^)]+\)[；;]?/g, '');
  text = text.replace(/可被\[清除\]\([^)]+\)[；;]?/g, '');
  // 免疫/清除[部分状态](…) — may appear at the start of a description (after ：)
  // so match an optional leading separator and preserve it via the callback
  text = text.replace(/([：。；;])?免疫\[部分状态\]\([^)]+\)[；;]?/g, (_full, sep) => sep ?? '');
  text = text.replace(/([：。；;])?清除\[部分状态\]\([^)]+\)[；;]?/g, (_full, sep) => sep ?? '');

  // Phase B: Chinese-quoted patterns
  // Use a captured optional leading separator — when the clause sits between
  // two skill effects (e.g.  effectA；会被"x"免疫；effectB) the leading ；
  // is preserved so the surrounding clauses stay separated.  When two status
  // clauses are adjacent (会被"x"免疫；会被"y"清除) the first removal
  // returns the leading ；, and the second clause still has its separator.
  // 会被"x"免疫 / 会被"x"、"y"免疫 (standalone, not inside a tooltip)
  text = text.replace(
    /([；;])?会被“[^”]+”(?:[、，]“[^”]+”)*免疫[；;]?/g,
    (_full, sep) => sep ?? ''
  );
  // 会被"x"清除 / 会被"x"、"y"清除
  text = text.replace(
    /([；;])?会被“[^”]+”(?:[、，]“[^”]+”)*清除[；;]?/g,
    (_full, sep) => sep ?? ''
  );
  // 免疫"x" / 免疫"x"、"y"
  text = text.replace(/([；;])?免疫“[^”]+”(?:[、，]“[^”]+”)*[；;]?/g, (_full, sep) => sep ?? '');
  // 清除"x" / 清除"x"、"y"
  text = text.replace(/([；;])?清除“[^”]+”(?:[、，]“[^”]+”)*[；;]?/g, (_full, sep) => sep ?? '');

  // Phase C: plain-text patterns
  // 该状态隶属于分组N,M,…
  text = text.replace(/该状态隶属于分组[\d,]+[。；;]?/g, '');
  // 清除xxx (plain text after {…} stripping, e.g. 清除吻痕)
  text = text.replace(/[；;]清除(?!\[)[^；;。]{1,40}[；;]?/g, '');

  // Cleanup: collapse consecutive separators and trim trailing punctuation
  text = text.replace(/[；;]{2,}/g, '；');
  text = text.replace(/[。；;]+$/g, '');

  return text;
}

export function buildSkillCluesForCharacter(
  character: CharacterLike,
  _allCharacters: Record<string, CharacterLike>,
  _allBuffs: Record<string, Buff>
): SkillClue[] {
  const skills = character.skills;
  if (!skills || skills.length === 0) return [];

  const clues: SkillClue[] = [];

  // Sort skills: passive, active, weapon1, weapon2
  const skillOrder: Record<string, number> = {
    passive: 0,
    active: 1,
    weapon1: 2,
    weapon2: 3,
  };
  const sorted = [...skills].sort((a, b) => (skillOrder[a.type] ?? 9) - (skillOrder[b.type] ?? 9));

  // Global quote → placeholder map so the same quoted text
  // gets the same #N across all skills
  const globalQuoteMap = new Map<string, string>();
  let quoteIndex = 0;

  for (let i = 0; i < sorted.length; i++) {
    const skill = sorted[i]!;

    // Build a SingleItem for buff lookup
    const factionId = character.factionId as SingleItem['factionId'];
    const singleItem: SingleItem = {
      name: skill.name,
      type: 'skill',
      ...(factionId ? { factionId } : {}),
    };
    const buffDescs = singleItemOwnbuffs(singleItem);
    if (buffDescs.length === 0) continue;

    // Join all buff descriptions for this skill
    let processed = buffDescs.join('\n');

    // Strip wiki markup {name} → name (keep the inner text)
    processed = processed.replace(/\{([^}]+)\}/g, '$1');

    // Strip status-mechanic clauses (immunity, clearing, grouping)
    processed = stripStatusClauses(processed);

    // --- Phase 1: Extract ALL Chinese-quoted text first ---
    // This must happen BEFORE tooltip extraction because buff names like
    // "[name](不在状态栏显示)" contain [...] (...) that would be
    // incorrectly parsed as hover-tooltip patterns.
    const quoteRegex = /“([^”]*)”/g;
    const quoteContents: string[] = [];

    const textWithQuoteMarkers = processed.replace(quoteRegex, (_full, inner) => {
      const idx = quoteContents.length;
      quoteContents.push(inner);
      return `${M}Q${idx}${M}`;
    });

    // --- Phase 2: Extract [visible](tooltip-content) patterns ---
    // Now that Chinese quotes are replaced with markers, [name](note)
    // patterns inside quotes won't be confused with hover tooltips.
    const tooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
    const tooltipContents: string[] = [];

    const textWithTooltipMarkers = textWithQuoteMarkers.replace(
      tooltipPattern,
      (_full, visible, tooltip) => {
        const idx = tooltipContents.length;
        tooltipContents.push(tooltip);
        return `[${visible}](${M}T${idx}${M})`;
      }
    );

    // --- Phase 3: Determine which quotes are in main text ---
    // Main text = everything outside tooltip-content markers.
    // Build quote→placeholder map for all quotes that appear in main text.
    //
    // First, map out every tooltip-content region: each occurrence of
    // (M T_N M) marks a region that is tooltip-only.
    const tooltipRegionRegex = new RegExp(`\\(${MR}T\\d+${MR}\\)`, 'g');
    const tooltipRegions: Array<{ start: number; end: number }> = [];
    let tr: RegExpExecArray | null;
    while ((tr = tooltipRegionRegex.exec(textWithTooltipMarkers)) !== null) {
      tooltipRegions.push({ start: tr.index, end: tr.index + tr[0].length });
    }

    const mainTextSet = new Set<number>();
    const mainTextQuoteRegex = new RegExp(`${MR}Q(\\d+)${MR}`, 'g');
    let mm: RegExpExecArray | null;
    while ((mm = mainTextQuoteRegex.exec(textWithTooltipMarkers)) !== null) {
      const pos = mm.index;
      const isInsideTooltip = tooltipRegions.some((r) => r.start < pos && pos < r.end);
      if (!isInsideTooltip) {
        const quoteIdx = parseInt(mm[1]!, 10);
        mainTextSet.add(quoteIdx);
      }
    }

    // Build this clue's quote→placeholder map (only main-text quotes)
    const perClueQuoteMap = new Map<string, string>();
    for (const idx of mainTextSet) {
      const quote = quoteContents[idx];
      if (quote === undefined) continue;
      let placeholder = globalQuoteMap.get(quote);
      if (!placeholder) {
        quoteIndex++;
        placeholder = `#${quoteIndex}`;
        globalQuoteMap.set(quote, placeholder);
      }
      perClueQuoteMap.set(placeholder, quote);
    }

    // --- Phase 4: Replace quote markers in main text & tooltips ---
    const quoteMarkerRegex = new RegExp(`${MR}Q(\\d+)${MR}`, 'g');

    // In main text: M Q_N M → #N (if assigned) or original "…"
    const mainTextProcessed = textWithTooltipMarkers.replace(quoteMarkerRegex, (_full, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const quote = quoteContents[idx];
      if (quote === undefined) return _full;
      const placeholder = globalQuoteMap.get(quote);
      return placeholder ? placeholder : `“${quote}”`;
    });

    // Process each tooltip content the same way
    const processedTooltips = tooltipContents.map((tooltip) =>
      tooltip.replace(quoteMarkerRegex, (_full, idxStr) => {
        const idx = parseInt(idxStr, 10);
        const quote = quoteContents[idx];
        if (quote === undefined) return _full;
        const placeholder = globalQuoteMap.get(quote);
        return placeholder ? placeholder : `“${quote}”`;
      })
    );

    // --- Phase 5: Reconstruct tooltip markers ---
    const tooltipMarkerRegex = new RegExp(`\\[([^\\]]+?)\\]\\(${MR}T(\\d+)${MR}\\)`, 'g');
    processed = mainTextProcessed.replace(tooltipMarkerRegex, (_full, visible, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const tooltipContent = processedTooltips[idx];
      return tooltipContent !== undefined ? `[${visible}](${tooltipContent})` : _full;
    });

    // Clean up excessive whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // Build placeholderMap only for placeholders used in this clue
    const placeholderMap: Record<string, string> = {};
    for (const [placeholder, real] of perClueQuoteMap) {
      placeholderMap[placeholder] = real;
    }

    clues.push({
      skillIndex: i,
      skillType: skill.type,
      anonymizedText: processed,
      placeholderMap,
    });
  }

  return clues;
}
