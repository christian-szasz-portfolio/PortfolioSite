import { ChartConfiguration } from 'chart.js';

import { UsageDay, UsageOperation, ViewSnapshot } from '../../../data';
import { ChartTheme, PanelChart } from '../chart-theme/chart-theme.utils';
import { SeriesSlots } from '../series-slots/series-slots.utils';
import { UsageTotals } from '../usage-totals/usage-totals.utils';

/** What each chart on the page is made of, as data rather than as a drawing. */
export class ChartConfig {
  /** Views a day, on their own, because interactions dwarf them on a shared axis. */
  public static views(days: readonly UsageDay[]): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: days.map(ChartConfig.shortDay),
        datasets: [
          {
            label: 'Views',
            data: days.map((day) => day.views),
            backgroundColor: ChartTheme.seriesColour(0),
            borderRadius: 4,
            borderSkipped: 'bottom',
            maxBarThickness: 24,
          },
        ],
      },
      options: ChartTheme.baseOptions({ legend: false }),
    };
  }

  /** What each day was made of, stacked, with the surface showing through between segments. */
  public static operations(
    days: readonly UsageDay[],
    operations: readonly UsageOperation[],
  ): PanelChart {
    // Nothing to compare a day against, so the composition is the whole story and a pie tells it
    // in one shape. A stacked bar of one day is a column with slivers stacked on it: the same
    // numbers, read off a length that starts wherever the segment below it ended.
    if (days.length < 2) {
      return ChartConfig.operationsPie(operations);
    }

    const { kept, tail } = SeriesSlots.foldTail(operations);
    const order = SeriesSlots.order(operations.map((operation) => operation.name));

    const datasets = kept.map((operation) => ({
      label: operation.label,
      data: UsageTotals.countPerDay(days, [operation.name]),
      backgroundColor: SeriesSlots.colour(operation.name, order),
      borderColor: ChartTheme.SURFACE,
      borderWidth: { top: 2, right: 0, bottom: 0, left: 0 },
      maxBarThickness: 28,
    }));

    if (tail.length > 0) {
      datasets.push({
        label: 'Other',
        data: UsageTotals.countPerDay(
          days,
          tail.map((operation) => operation.name),
        ),
        backgroundColor: ChartTheme.OTHER,
        borderColor: ChartTheme.SURFACE,
        borderWidth: { top: 2, right: 0, bottom: 0, left: 0 },
        maxBarThickness: 28,
      });
    }

    return {
      type: 'bar',
      data: { labels: days.map(ChartConfig.shortDay), datasets },
      options: ChartTheme.baseOptions({ stacked: true }),
    };
  }

  /** The same operations with no time axis to put them on: one pie, cut into its slices. */
  private static operationsPie(operations: readonly UsageOperation[]): ChartConfiguration<'pie'> {
    const { kept, tail } = SeriesSlots.foldTail(operations);
    const order = SeriesSlots.order(operations.map((operation) => operation.name));
    const rest = tail.reduce((sum, operation) => sum + operation.count, 0);

    const labels = kept.map((operation) => operation.label);
    const data = kept.map((operation) => operation.count);
    const colours = kept.map((operation) => SeriesSlots.colour(operation.name, order));

    if (rest > 0) {
      labels.push('Other');
      data.push(rest);
      colours.push(ChartTheme.OTHER);
    }

    return {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colours,
            borderColor: ChartTheme.SURFACE,
            borderWidth: 2,
          },
        ],
      },
      options: ChartTheme.pieOptions(),
    };
  }

  /** Where the running total came from. One bar, cut into its parts. */
  public static countries(snapshot: ViewSnapshot): ChartConfiguration<'bar'> {
    const { kept, tail } = SeriesSlots.foldTail(snapshot.countries);
    const order = SeriesSlots.order(kept.map((country) => country.code));
    const rest = tail.reduce((sum, country) => sum + country.count, 0);

    const datasets = kept.map((country) => ({
      label: country.code === 'ZZ' ? 'Unknown' : country.code,
      data: [country.count],
      backgroundColor: SeriesSlots.colour(country.code, order),
      borderColor: ChartTheme.SURFACE,
      borderWidth: { left: 2, top: 0, right: 0, bottom: 0 },
      maxBarThickness: 40,
    }));

    if (rest > 0) {
      datasets.push({
        label: 'Other',
        data: [rest],
        backgroundColor: ChartTheme.OTHER,
        borderColor: ChartTheme.SURFACE,
        borderWidth: { left: 2, top: 0, right: 0, bottom: 0 },
        maxBarThickness: 40,
      });
    }

    return {
      type: 'bar',
      data: { labels: ['Views'], datasets },
      options: ChartTheme.baseOptions({ stacked: true, horizontal: true }),
    };
  }

  /** The day as an axis label: the year is on the panel, so the label carries month and day. */
  private static shortDay(day: UsageDay): string {
    return day.day.slice(5);
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
