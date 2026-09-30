import { UsageDay } from '../../../data';
import { UsageTotals } from './usage-totals.utils';

function day(name: string, count: number): UsageDay {
  return {
    day: '2026-09-07',
    views: 1,
    interactions: count,
    rejected: 0,
    operations: [
      { name, label: name, count },
      { name: 'other', label: 'Other', count: 2 },
    ],
    archivedAt: '2026-09-08T06:00:00Z',
  };
}

describe('UsageTotals', () => {
  it('counts only the operations it was asked about', () => {
    expect(UsageTotals.countOn(day('route', 9), ['route'])).toBe(9);
  });

  it('adds several operations together, which is how a folded tail is measured', () => {
    expect(UsageTotals.countOn(day('route', 9), ['route', 'other'])).toBe(11);
  });

  it('answers zero for a day that holds none of them, rather than skipping the day', () => {
    expect(UsageTotals.countOn(day('route', 9), ['cv.open'])).toBe(0);
  });

  it('keeps one number per day, in the order the days came in', () => {
    expect(UsageTotals.countPerDay([day('route', 1), day('route', 4)], ['route'])).toEqual([1, 4]);
  });
});
