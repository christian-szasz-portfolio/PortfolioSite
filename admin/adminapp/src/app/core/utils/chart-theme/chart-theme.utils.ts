import { ChartConfiguration, ChartOptions } from 'chart.js';

/** What a panel may draw: bars over days, a pie for a part-to-whole. */
export type PanelChart = ChartConfiguration<'bar'> | ChartConfiguration<'pie'>;

/** How a chart is laid out, beyond the data it carries. */
export interface ChartShape {
  readonly stacked?: boolean;
  readonly horizontal?: boolean;
  readonly legend?: boolean;
}

/** The chart surface, the ink on it, and the colours the data wears. */
export class ChartTheme {
  public static readonly SURFACE = '#1a1a19';
  public static readonly INK = '#ffffff';
  public static readonly MUTED = '#898781';
  public static readonly GRID = '#2c2c2a';
  public static readonly AXIS = '#383835';

  /** The categorical slots, in fixed order, validated as a set against this surface. */
  public static readonly SERIES = [
    '#3987e5',
    '#d95926',
    '#199e70',
    '#c98500',
    '#d55181',
    '#008300',
    '#9085e9',
    '#e66767',
  ] as const;

  /** Where the tail goes once the slots are spent. */
  public static readonly OTHER = ChartTheme.MUTED;

  /** How many classes may carry a colour before the rest becomes "Other". */
  public static readonly SERIES_LIMIT = ChartTheme.SERIES.length - 1;

  /** The colour of the nth class, or the "Other" grey once the slots run out. */
  public static seriesColour(index: number): string {
    return ChartTheme.SERIES[index] ?? ChartTheme.OTHER;
  }

  /** What every chart here shares: grid, ticks, legend and tooltips. */
  public static baseOptions(shape: ChartShape = {}): ChartOptions<'bar'> {
    const stacked = shape.stacked ?? false;
    const horizontal = shape.horizontal ?? false;
    const legend = shape.legend ?? true;

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      animation: { duration: 220 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: legend,
          position: 'bottom',
          labels: {
            color: ChartTheme.MUTED,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: '#0d0d0d',
          borderColor: ChartTheme.AXIS,
          borderWidth: 1,
          titleColor: ChartTheme.INK,
          bodyColor: '#c3c2b7',
          padding: 10,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          stacked,
          grid: { display: false },
          border: { color: horizontal ? 'transparent' : ChartTheme.AXIS },
          ticks: { display: !horizontal, color: ChartTheme.MUTED, font: { size: 11 } },
        },
        y: {
          stacked,
          beginAtZero: true,
          grid: { display: !horizontal, color: ChartTheme.GRID, lineWidth: 1 },
          border: { display: false },
          ticks: {
            display: !horizontal,
            color: ChartTheme.MUTED,
            font: { size: 11 },
            precision: 0,
          },
        },
      },
    };
  }

  /** A pie, which has no axes and so shares only the ink. */
  public static pieOptions(): ChartOptions<'pie'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 220 },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: ChartTheme.MUTED,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: '#0d0d0d',
          borderColor: ChartTheme.AXIS,
          borderWidth: 1,
          titleColor: ChartTheme.INK,
          bodyColor: '#c3c2b7',
          padding: 10,
          usePointStyle: true,
        },
      },
    };
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
