import { UsageDay, UsageOperation, ViewSnapshot } from '../../../data';
import { ChartTheme } from '../chart-theme/chart-theme.utils';
import { ChartConfig } from './chart-config.utils';

function day(date: string, views: number, operations: readonly UsageOperation[]): UsageDay {
  return {
    day: date,
    views,
    interactions: operations.reduce((sum, operation) => sum + operation.count, 0),
    rejected: 0,
    operations,
    archivedAt: `${date}T06:00:00Z`,
  };
}

function operation(name: string, count: number): UsageOperation {
  return { name, label: name.toUpperCase(), count };
}

function manyOperations(howMany: number): UsageOperation[] {
  return Array.from({ length: howMany }, (_, index) => operation(`op-${index}`, howMany - index));
}

/** The colour a named series was given, or '' if there is no such series. */
function colourOf(
  datasets: readonly { readonly label?: string | undefined; readonly backgroundColor?: unknown }[],
  label: string,
): string {
  return String(datasets.find((dataset) => dataset.label === label)?.backgroundColor ?? '');
}

const DAYS: readonly UsageDay[] = [
  day('2026-09-06', 4, [operation('route', 9), operation('section', 5)]),
  day('2026-09-07', 2, [operation('route', 3)]),
];

const SNAPSHOT: ViewSnapshot = {
  day: '2026-09-07',
  takenAt: '2026-09-07T06:00:00Z',
  total: 46,
  countries: [
    { code: 'RO', count: 40 },
    { code: 'ZZ', count: 6 },
  ],
};

describe('ChartConfig.views', () => {
  it('labels the days by month and day, since the panel carries the year', () => {
    expect(ChartConfig.views(DAYS).data.labels).toEqual(['09-06', '09-07']);
  });

  it('plots views alone, on one axis', () => {
    const config = ChartConfig.views(DAYS);

    expect(config.data.datasets).toHaveLength(1);
    expect(config.data.datasets[0]?.data).toEqual([4, 2]);
    expect(config.options?.scales?.['y1']).toBeUndefined();
  });

  it('leaves out a legend that would only repeat the heading', () => {
    expect(ChartConfig.views(DAYS).options?.plugins?.legend?.display).toBe(false);
  });
});

describe('ChartConfig.operations', () => {
  it('gives each operation a series and stacks the day into them', () => {
    const config = ChartConfig.operations(DAYS, [operation('route', 12), operation('section', 5)]);

    expect(config.data.datasets.map((dataset) => dataset.label)).toEqual(['ROUTE', 'SECTION']);
    expect(config.data.datasets[0]?.data).toEqual([9, 3]);
    expect(config.data.datasets[1]?.data).toEqual([5, 0]);
    expect(config.options?.scales?.['x']?.stacked).toBe(true);
  });

  it('colours an operation by which one it is, not by where it ranks', () => {
    const busiest = ChartConfig.operations(DAYS, [operation('route', 12), operation('section', 5)]);
    const overtaken = ChartConfig.operations(DAYS, [
      operation('section', 12),
      operation('route', 5),
    ]);

    expect(colourOf(busiest.data.datasets, 'ROUTE')).toBe(
      colourOf(overtaken.data.datasets, 'ROUTE'),
    );
  });

  it('folds everything past the last colour slot into one grey Other', () => {
    const config = ChartConfig.operations(DAYS, manyOperations(ChartTheme.SERIES_LIMIT + 3));

    expect(config.data.datasets).toHaveLength(ChartTheme.SERIES_LIMIT + 1);
    expect(config.data.datasets[ChartTheme.SERIES_LIMIT]?.label).toBe('Other');
    expect(colourOf(config.data.datasets, 'Other')).toBe(ChartTheme.OTHER);
  });

  // One day is a composition with nothing to compare it against, and a stacked bar of one is a
  // column with slivers on it: the same numbers, each read off a length starting wherever the one
  // below it ended.
  it('draws a single day as a pie rather than a bar of one', () => {
    const config = ChartConfig.operations(
      [DAYS[0] as UsageDay],
      [operation('route', 9), operation('section', 5)],
    );

    expect(config.type).toBe('pie');
    expect(config.data.labels).toEqual(['ROUTE', 'SECTION']);
    expect(config.data.datasets[0]?.data).toEqual([9, 5]);
  });

  it('draws an empty archive as a pie too, rather than one bar of nothing', () => {
    expect(ChartConfig.operations([], []).type).toBe('pie');
  });

  it('goes back to bars as soon as there is a second day to compare', () => {
    expect(ChartConfig.operations(DAYS, [operation('route', 12)]).type).toBe('bar');
  });

  it('keeps an operation the colour it has in the bars when it is a slice', () => {
    const bars = ChartConfig.operations(DAYS, [operation('route', 12), operation('section', 5)]);
    const pie = ChartConfig.operations(
      [DAYS[0] as UsageDay],
      [operation('route', 12), operation('section', 5)],
    );

    const slices = pie.data.datasets[0]?.backgroundColor;

    expect(Array.isArray(slices) ? slices[0] : '').toBe(colourOf(bars.data.datasets, 'ROUTE'));
  });

  it('folds the tail into one Other slice as well', () => {
    const pie = ChartConfig.operations(
      [DAYS[0] as UsageDay],
      manyOperations(ChartTheme.SERIES_LIMIT + 3),
    );

    expect(pie.data.labels).toHaveLength(ChartTheme.SERIES_LIMIT + 1);
    expect((pie.data.labels ?? []).at(-1)).toBe('Other');
  });

  it('adds no Other when everything already has a slot', () => {
    const config = ChartConfig.operations(DAYS, [operation('route', 12)]);

    expect(config.data.datasets.map((dataset) => dataset.label)).not.toContain('Other');
  });
});

describe('ChartConfig.countries', () => {
  it('cuts one bar into the countries it came from', () => {
    const config = ChartConfig.countries(SNAPSHOT);

    expect(config.data.labels).toEqual(['Views']);
    expect(config.data.datasets).toHaveLength(2);
    expect(config.options?.indexAxis).toBe('y');
  });

  it('says Unknown rather than showing the placeholder code', () => {
    expect(ChartConfig.countries(SNAPSHOT).data.datasets[1]?.label).toBe('Unknown');
  });

  it('takes its colours from the same slots as everything else', () => {
    const config = ChartConfig.countries(SNAPSHOT);

    expect(colourOf(config.data.datasets, 'RO')).toBe(ChartTheme.seriesColour(0));
  });

  it('draws nothing at all when the counter has no countries yet', () => {
    const config = ChartConfig.countries({ ...SNAPSHOT, countries: [] });

    expect(config.data.datasets).toEqual([]);
  });
});
