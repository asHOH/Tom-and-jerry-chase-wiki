import { differenceInCalendarDays, format, isSameYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export type DateInput = string | number | Date;
type OptionalDateInput = DateInput | null | undefined;

type CompactDateTimeOptions = {
  relativeRecent?: boolean;
  invalidFallback?: string;
};

/**
 * Formats timestamps with compact current-year dates.
 */
export function formatCompactDateTime(value: DateInput, options?: CompactDateTimeOptions) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return options?.invalidFallback ?? '';
  }

  const now = new Date();
  const dayDiff = differenceInCalendarDays(now, date);
  const timePart = format(date, 'HH:mm', { locale: zhCN });

  if (options?.relativeRecent && dayDiff >= 0 && dayDiff <= 2) {
    const label = dayDiff === 0 ? '今天' : dayDiff === 1 ? '昨天' : '前天';
    return `${label} ${timePart}`;
  }

  if (isSameYear(date, now)) {
    return `${format(date, 'MM-dd', { locale: zhCN })} ${timePart}`;
  }

  return `${format(date, 'yyyy-MM-dd', { locale: zhCN })} ${timePart}`;
}

/**
 * Formats dates without time using compact current-year dates.
 */
export function formatCompactDate(value: OptionalDateInput, options?: CompactDateTimeOptions) {
  if (value == null) {
    return options?.invalidFallback ?? '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return options?.invalidFallback ?? '';
  }

  if (isSameYear(date, new Date())) {
    return format(date, 'MM-dd', { locale: zhCN });
  }

  return format(date, 'yyyy-MM-dd', { locale: zhCN });
}

/**
 * Formats article timestamps with localized rules for recent dates and current year.
 */
export function formatArticleDate(value: DateInput) {
  return formatCompactDateTime(value, { relativeRecent: true, invalidFallback: '' });
}
