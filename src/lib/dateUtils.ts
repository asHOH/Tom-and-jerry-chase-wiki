import { differenceInCalendarDays, format, isSameYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export type DateInput = string | number | Date;

/**
 * Formats article timestamps with localized rules for recent dates and current year.
 */
export function formatArticleDate(value: DateInput) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const dayDiff = differenceInCalendarDays(now, date);
  const timePart = format(date, 'HH:mm', { locale: zhCN });

  if (dayDiff >= 0 && dayDiff <= 2) {
    const label = dayDiff === 0 ? '今天' : dayDiff === 1 ? '昨天' : '前天';
    return `${label} ${timePart}`;
  }

  if (isSameYear(date, now)) {
    return `${format(date, 'MM月dd日', { locale: zhCN })} ${timePart}`;
  }

  return `${format(date, 'yyyy年MM月dd日', { locale: zhCN })} ${timePart}`;
}
