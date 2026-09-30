import { ChartTheme } from '../chart-theme/chart-theme.utils';

/** A list cut at the last colour slot: what is drawn apart, and what is drawn together. */
export interface Folded<T> {
  readonly kept: readonly T[];
  readonly tail: readonly T[];
}

/** Which class carries which colour, and what happens to the ones that get none. */
export class SeriesSlots {
  /** The classes that carry a colour, in an order the counts cannot change. */
  public static order(keys: readonly string[]): readonly string[] {
    return [...keys].slice(0, ChartTheme.SERIES_LIMIT).sort();
  }

  /** The colour of one class, by which class it is rather than where it currently ranks. */
  public static colour(key: string, order: readonly string[]): string {
    const slot = order.indexOf(key);

    return slot >= 0 && slot < ChartTheme.SERIES_LIMIT
      ? ChartTheme.seriesColour(slot)
      : ChartTheme.seriesColour(ChartTheme.SERIES_LIMIT + 1);
  }

  /** Splits off everything past the last slot into one grey Other. */
  public static foldTail<T>(items: readonly T[]): Folded<T> {
    return {
      kept: items.slice(0, ChartTheme.SERIES_LIMIT),
      tail: items.slice(ChartTheme.SERIES_LIMIT),
    };
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
