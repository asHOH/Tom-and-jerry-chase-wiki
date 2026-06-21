/**
 * Game utilities: seeded PRNG, daily puzzle rotation, emoji grids, share text.
 *
 * All game pages import from here for consistent daily puzzle behavior.
 */

/**
 * Mulberry32 — a fast, high-quality 32-bit seeded PRNG.
 * Deterministic: same seed always produces the same sequence.
 */
export function seededRandom(seed: string): () => number {
  // Hash the seed string to a 32-bit integer using DJB2
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }

  // Mulberry32 state
  let state = hash >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get the current game date in Asia/Shanghai timezone.
 * Ensures the daily puzzle is consistent across all timezones.
 */
export function getGameDate(): Date {
  const now = new Date();
  const shanghaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  // Truncate to date only
  return new Date(shanghaiTime.getFullYear(), shanghaiTime.getMonth(), shanghaiTime.getDate());
}

/**
 * Format a Date as "YYYY-MM-DD" string (used as daily puzzle seed).
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Pick a daily character ID deterministically from the date.
 * Returns the same character for the same date worldwide.
 */
export function getDailyCharacterId(
  date: Date,
  characterIds: readonly string[]
): { characterId: string; dateStr: string } {
  const dateStr = formatDateKey(date);
  const rng = seededRandom(dateStr);
  const index = Math.floor(rng() * characterIds.length);
  return {
    characterId: characterIds[index]!,
    dateStr,
  };
}

/**
 * Generate a Wordle-style emoji grid for the Guess Character game.
 *
 * ⬜ = faction hint (always shown at start)
 * 🟨 = wrong guess
 * 🟩 = correct guess
 */
export function generateEmojiGrid(
  guesses: string[],
  correctGuessIndex: number | null,
  _maxClues: number
): string {
  const lines: string[] = [];

  for (let i = 0; i < guesses.length; i++) {
    if (correctGuessIndex !== null && i === correctGuessIndex) {
      // Correct guess — show row of 🟩
      lines.push('🟩'.repeat(i + 1));
      break;
    } else {
      // Wrong guess — show ⬜ for faction + 🟨 for each wrong
      const row = '⬜' + '🟨'.repeat(i);
      lines.push(row);
    }
  }

  // If never guessed correctly
  if (correctGuessIndex === null && guesses.length > 0) {
    lines.push('⬜' + '🟨'.repeat(guesses.length));
  }

  return lines.join('\n');
}

/**
 * Generate the full shareable result text for Game 1 (Guess Character).
 */
export function generateGuessShareText(
  puzzleNumber: number,
  guesses: string[],
  correctGuessIndex: number | null,
  characterName: string,
  maxClues: number
): string {
  const resultLine =
    correctGuessIndex !== null
      ? `${correctGuessIndex + 1}/${maxClues} 猜中`
      : `未猜中 (答案是 ${characterName})`;

  return [
    `🎮 猜角色 #${puzzleNumber}`,
    generateEmojiGrid(guesses, correctGuessIndex, maxClues),
    `→ ${characterName}`,
    resultLine,
    '',
    '来试试：tjwiki.com/games/guess-character/',
  ].join('\n');
}

/**
 * Generate a puzzle number from a date string (days since epoch).
 * Creates a sequential puzzle number like Wordle.
 */
export function getPuzzleNumber(dateStr: string): number {
  const EPOCH = new Date('2026-06-20').getTime(); // Day before launch
  const date = new Date(dateStr + 'T00:00:00+08:00');
  return Math.floor((date.getTime() - EPOCH) / 86400000);
}
