import { ChartTheme } from '../chart-theme/chart-theme.utils';
import { SeriesSlots } from './series-slots.utils';

function names(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `op-${index}`);
}

describe('SeriesSlots', () => {
  it('gives a class the same colour whatever it currently ranks', () => {
    const busiest = SeriesSlots.order(['route', 'section', 'cv.open']);
    const overtaken = SeriesSlots.order(['section', 'cv.open', 'route']);

    expect(SeriesSlots.colour('cv.open', busiest)).toBe(SeriesSlots.colour('cv.open', overtaken));
  });

  it('hands the slots out in name order, so the order is a property of the set', () => {
    const order = SeriesSlots.order(['route', 'cv.open']);

    expect(order).toEqual(['cv.open', 'route']);
    expect(SeriesSlots.colour('cv.open', order)).toBe(ChartTheme.seriesColour(0));
    expect(SeriesSlots.colour('route', order)).toBe(ChartTheme.seriesColour(1));
  });

  it('colours a class it was never given the tail grey rather than a data colour', () => {
    expect(SeriesSlots.colour('unheard-of', SeriesSlots.order(['route']))).toBe(ChartTheme.OTHER);
  });

  it('takes no more classes than there are slots', () => {
    expect(SeriesSlots.order(names(ChartTheme.SERIES_LIMIT + 5))).toHaveLength(
      ChartTheme.SERIES_LIMIT,
    );
  });

  it('folds everything past the last slot into one tail', () => {
    const folded = SeriesSlots.foldTail(names(ChartTheme.SERIES_LIMIT + 3));

    expect(folded.kept).toHaveLength(ChartTheme.SERIES_LIMIT);
    expect(folded.tail).toHaveLength(3);
  });

  it('leaves a short list whole, with nothing to fold', () => {
    const folded = SeriesSlots.foldTail(['route', 'section']);

    expect(folded.kept).toEqual(['route', 'section']);
    expect(folded.tail).toEqual([]);
  });
});
