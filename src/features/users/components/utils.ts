import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHANGHAI_TIME_ZONE = 'Asia/Shanghai';

type ShanghaiDateParts = {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
};

function getShanghaiDateParts(date: Date, includeTime = false): ShanghaiDateParts | null {
  if (!isValid(date)) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime ? ({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const) : {}),
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');
  if (!year || !month || !day) return null;

  const result: ShanghaiDateParts = { year, month, day };
  const hour = values.get('hour');
  const minute = values.get('minute');
  if (includeTime && hour && minute) {
    result.hour = hour;
    result.minute = minute;
  }
  return result;
}

function getShanghaiDateKey(date: Date): string {
  const parts = getShanghaiDateParts(date);
  if (!parts) throw new RangeError('Invalid date');
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const contributionNumberFormatter = new Intl.NumberFormat('zh-CN');

/** Returns a canonical YYYY-MM-DD key for a date-only or ISO timestamp value. */
export function normalizeContributionDateKey(value: string): string | null {
  const candidate = value.slice(0, 10);
  if (!DATE_KEY_PATTERN.test(candidate)) return null;

  const date = parseISO(candidate);
  if (!isValid(date) || format(date, 'yyyy-MM-dd') !== candidate) return null;

  return candidate;
}

/** Parses a canonical date key as a local calendar date. */
export function parseContributionDate(value: string): Date | null {
  const key = normalizeContributionDateKey(value);
  if (!key) return null;

  const date = parseISO(key);
  return isValid(date) ? date : null;
}

export function contributionDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Keeps a supplied snapshot date from ever making the calendar show future days. */
export function resolveContributionEndDate(asOf?: string): Date {
  const today = parseISO(getShanghaiDateKey(new Date()));
  const requested = asOf ? parseContributionDate(asOf) : null;

  if (!requested || isAfter(requested, today)) return today;
  return requested;
}

export function formatContributionDate(value: string): string {
  const date = parseContributionDate(value);
  return date ? format(date, 'yyyy年M月d日', { locale: zhCN }) : '未知日期';
}

export function formatContributionMonth(value: string): string {
  const dateKey = DATE_KEY_PATTERN.test(value) ? normalizeContributionDateKey(value) : null;
  if (dateKey) {
    return `${dateKey.slice(0, 4)}年${Number(dateKey.slice(5, 7))}月`;
  }

  const parts = getShanghaiDateParts(new Date(value));
  return parts ? `${parts.year}年${Number(parts.month)}月` : '时间未知';
}

export function formatContributionTimestamp(value: string): string {
  const date = new Date(value);
  const parts = getShanghaiDateParts(date, true);
  const currentYear = getShanghaiDateParts(new Date())?.year;
  if (!parts?.hour || !parts.minute) return '未知时间';

  const dateLabel =
    parts.year === currentYear
      ? `${parts.month}-${parts.day}`
      : `${parts.year}-${parts.month}-${parts.day}`;
  return `${dateLabel} ${parts.hour}:${parts.minute}`;
}

export function contributionMonthKey(value: string): string | null {
  const dateKey = DATE_KEY_PATTERN.test(value) ? normalizeContributionDateKey(value) : null;
  if (dateKey) return dateKey.slice(0, 7);

  const parts = getShanghaiDateParts(new Date(value));
  return parts ? `${parts.year}-${parts.month}` : null;
}

export function formatContributionCount(value: number): string {
  return contributionNumberFormatter.format(Number.isFinite(value) ? Math.max(0, value) : 0);
}

export function formatContributionAverage(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
}

export type ContributionCalendarRange = {
  endDate: Date;
  startDate: Date;
  gridStartDate: Date;
  weekCount: number;
};

export function getContributionCalendarRange(asOf?: string): ContributionCalendarRange {
  const endDate = resolveContributionEndDate(asOf);
  const startDate = subDays(endDate, 364);
  const gridStartDate = startOfWeek(startDate, { weekStartsOn: 0 });
  const dayCount = differenceInCalendarDays(endDate, gridStartDate) + 1;

  return {
    endDate,
    startDate,
    gridStartDate,
    weekCount: Math.ceil(dayCount / 7),
  };
}

export type ContributionCalendarCell = {
  date: string | null;
  isVisible: boolean;
};

export function buildContributionCalendarWeeks(
  asOf: string | undefined
): ContributionCalendarCell[][] {
  const { endDate, startDate, gridStartDate, weekCount } = getContributionCalendarRange(asOf);

  return Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(gridStartDate, weekIndex * 7 + dayIndex);
      const isVisible = !isBefore(date, startDate) && !isAfter(date, endDate);

      return {
        date: isVisible ? contributionDateKey(date) : null,
        isVisible,
      };
    })
  );
}
