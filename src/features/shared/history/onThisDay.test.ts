import onThisDayEvents from '@/data/generated/historyOnThisDay.json';

import {
  formatHistoryEventDate,
  getOnThisDayEvents,
  type OnThisDayEntries,
  type OnThisDayEvent,
} from './onThisDay';

const createEvent = (overrides: Partial<OnThisDayEvent>): OnThisDayEvent => ({
  year: 2020,
  date: '5.13',
  description: '默认描述',
  ...overrides,
});

const allEntries = (entries: OnThisDayEntries): OnThisDayEvent[] => [
  ...entries.topTier,
  ...entries.others,
];

describe('getOnThisDayEvents', () => {
  it('groups matching entries into the highest tier and the rest', () => {
    const events = [
      createEvent({ year: 2015, description: '甲' }),
      createEvent({ year: 2016, description: '乙', milestone: '里程碑' }),
      createEvent({ year: 2017, description: '丙' }),
      createEvent({ year: 2018, date: '5.1-5.20', description: '测试期间' }),
      createEvent({ year: 2019, date: '5.14', description: '其他日期' }),
    ];

    const entries = getOnThisDayEvents(events, new Date(2026, 4, 13));

    expect(entries.topTier.map((entry) => entry.description)).toEqual(['乙']);
    expect(entries.others.map((entry) => entry.description)).toEqual(['甲', '丙', '测试期间']);
  });

  it('keeps milestone spans above ordinary point-in-time events', () => {
    const events = [
      createEvent({ year: 2018, description: '单日事件' }),
      createEvent({ year: 2019, date: '5.1-5.20', description: '里程碑测试', milestone: '里程碑' }),
    ];

    const entries = getOnThisDayEvents(events, new Date(2026, 4, 13));

    expect(entries.topTier.map((entry) => entry.description)).toEqual(['里程碑测试']);
    expect(entries.others.map((entry) => entry.description)).toEqual(['单日事件']);
  });

  it('returns the same groups regardless of input order', () => {
    const events = [
      createEvent({ year: 2016, description: '乙' }),
      createEvent({ year: 2015, description: '甲' }),
      createEvent({ year: 2016, date: '5.1-6.1', description: '测试期间' }),
    ];
    const date = new Date(2026, 4, 13);

    expect(getOnThisDayEvents([...events].reverse(), date)).toEqual(
      getOnThisDayEvents(events, date)
    );
  });

  it('includes both point-in-time and span events covering the day', () => {
    const events = [
      createEvent({ date: '5.1-5.20', description: '测试期间' }),
      createEvent({ date: '5.13', description: '单日事件' }),
    ];

    const entries = getOnThisDayEvents(events, new Date(2026, 4, 13));

    expect(entries.topTier.map((entry) => entry.description)).toEqual(['单日事件']);
    expect(entries.others.map((entry) => entry.description)).toEqual(['测试期间']);
  });

  it('matches the start and end days of a span event', () => {
    const events = [createEvent({ date: '5.12-5.19', description: '测试' })];

    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 4, 12)))).toHaveLength(1);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 4, 19)))).toHaveLength(1);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 4, 11)))).toEqual([]);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 4, 20)))).toEqual([]);
  });

  it('matches span events that cross into the next year', () => {
    const events = [createEvent({ date: '12.27-次年1.1', description: '跨年活动' })];

    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 11, 27)))).toHaveLength(1);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 11, 31)))).toHaveLength(1);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 0, 1)))).toHaveLength(1);
    expect(allEntries(getOnThisDayEvents(events, new Date(2026, 0, 2)))).toEqual([]);
  });

  it('returns empty groups when nothing happened on the date', () => {
    const events = [createEvent({ date: '5.13' })];

    expect(getOnThisDayEvents(events, new Date(2026, 4, 14))).toEqual({
      topTier: [],
      others: [],
    });
    expect(getOnThisDayEvents([], new Date(2026, 4, 13))).toEqual({
      topTier: [],
      others: [],
    });
  });

  it('returns a top tier for every calendar day with the real dataset', () => {
    for (let month = 0; month < 12; month += 1) {
      const daysInMonth = new Date(2026, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const entries = getOnThisDayEvents(onThisDayEvents, new Date(2026, month, day));
        if (entries.topTier.length === 0) {
          throw new Error(`missing entry for 2026-${month + 1}-${day}`);
        }
      }
    }
  });
});

describe('formatHistoryEventDate', () => {
  it('formats single dates', () => {
    expect(formatHistoryEventDate('5.13')).toBe('5月13日');
  });

  it('formats same-year spans', () => {
    expect(formatHistoryEventDate('2.8-4.18')).toBe('2月8日–4月18日');
  });

  it('formats spans that cross into the next year', () => {
    expect(formatHistoryEventDate('12.27-次年1.1')).toBe('12月27日–次年1月1日');
  });

  it('returns unparseable input unchanged', () => {
    expect(formatHistoryEventDate('未知')).toBe('未知');
  });
});
