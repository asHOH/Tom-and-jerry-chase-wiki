import { getGameDate } from '@/lib/gameUtils';

export type OnThisDayEvent = {
  year: number;
  date: string;
  description: string;
  milestone?: string;
};

export type OnThisDayEntries = {
  topTier: OnThisDayEvent[];
  others: OnThisDayEvent[];
};

type MonthDay = { month: number; day: number };

type DateRange = {
  start: MonthDay;
  end: MonthDay | null;
  wrapsYear: boolean;
};

type Candidate = {
  event: OnThisDayEvent;
  range: DateRange;
};

// Feb counts as 29 days so leap days still order correctly.
const MONTH_STARTS = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

function parseMonthDay(part: string): MonthDay | null {
  const match = /^(\d{1,2})\.(\d{1,2})$/.exec(part);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { month, day };
}

function parseDateRange(date: string): DateRange | null {
  const parts = date.split('-');
  if (parts.length === 0 || parts.length > 2) return null;

  const start = parseMonthDay(parts[0]!);
  if (!start) return null;
  if (parts.length === 1) return { start, end: null, wrapsYear: false };

  let endPart = parts[1]!;
  const wrapsYear = endPart.startsWith('次年');
  if (wrapsYear) endPart = endPart.slice(2);

  const end = parseMonthDay(endPart);
  if (!end) return null;

  return { start, end, wrapsYear };
}

function toOrdinal({ month, day }: MonthDay): number {
  return MONTH_STARTS[month - 1]! + day;
}

function matchesDay(range: DateRange, month: number, day: number): boolean {
  if (!range.end) return range.start.month === month && range.start.day === day;

  const today = toOrdinal({ month, day });
  const start = toOrdinal(range.start);
  const end = toOrdinal(range.end);

  return range.wrapsYear ? today >= start || today <= end : today >= start && today <= end;
}

// Point-in-time milestones read best, then other one-off events; span events
// (tests, seasons) are lower tiers because they overlap many calendar days.
function rankCandidate({ event, range }: Candidate): number {
  return (event.milestone ? 0 : 2) + (range.end ? 1 : 0);
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareCandidates(a: Candidate, b: Candidate): number {
  return (
    rankCandidate(a) - rankCandidate(b) ||
    a.event.year - b.event.year ||
    compareText(a.event.date, b.event.date) ||
    compareText(a.event.description, b.event.description)
  );
}

/**
 * Returns every history entry matching the given Asia/Shanghai calendar date,
 * split into the highest-ranked tier and the rest. Each group is ordered
 * chronologically. Span events (tests, seasons) match every day they cover,
 * so most dates have several entries.
 */
export function getOnThisDayEvents(
  events: readonly OnThisDayEvent[],
  date: Date = getGameDate()
): OnThisDayEntries {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const candidates = events
    .map((event) => ({ event, range: parseDateRange(event.date) }))
    .filter(
      (candidate): candidate is Candidate =>
        candidate.range !== null && matchesDay(candidate.range, month, day)
    )
    .sort(compareCandidates);

  if (candidates.length === 0) {
    return { topTier: [], others: [] };
  }

  const topRank = rankCandidate(candidates[0]!);

  return {
    topTier: candidates.filter((c) => rankCandidate(c) === topRank).map((c) => c.event),
    others: candidates.filter((c) => rankCandidate(c) !== topRank).map((c) => c.event),
  };
}

function formatMonthDay(part: string): string {
  const parsed = parseMonthDay(part);
  return parsed ? `${parsed.month}月${parsed.day}日` : part;
}

export function formatHistoryEventDate(date: string): string {
  const parts = date.split('-');
  if (parts.length === 0 || parts.length > 2) return date;

  if (parts.length === 1) return formatMonthDay(parts[0]!);

  let endPart = parts[1]!;
  const prefix = endPart.startsWith('次年') ? '次年' : '';
  if (prefix) endPart = endPart.slice(2);

  return `${formatMonthDay(parts[0]!)}–${prefix}${formatMonthDay(endPart)}`;
}
