import { ChartTheme } from './chart-theme.utils';

describe('ChartTheme', () => {
  it('keeps one slot in hand, so the tail always has a colour that is not a data colour', () => {
    expect(ChartTheme.SERIES_LIMIT).toBeLessThan(ChartTheme.SERIES.length);
    expect(ChartTheme.SERIES).not.toContain(ChartTheme.OTHER);
  });

  it('hands out the slots in order rather than cycling them', () => {
    expect(ChartTheme.seriesColour(0)).toBe(ChartTheme.SERIES[0]);
    expect(ChartTheme.seriesColour(ChartTheme.SERIES.length - 1)).toBe(
      ChartTheme.SERIES[ChartTheme.SERIES.length - 1],
    );
  });

  it('answers with the tail grey past the last slot, never with a repeated hue', () => {
    expect(ChartTheme.seriesColour(ChartTheme.SERIES.length)).toBe(ChartTheme.OTHER);
    expect(ChartTheme.seriesColour(99)).toBe(ChartTheme.OTHER);
  });

  it('stacks both axes together, or neither, so a stacked chart cannot half stack', () => {
    const stacked = ChartTheme.baseOptions({ stacked: true });

    expect(stacked.scales?.['x']?.stacked).toBe(true);
    expect(stacked.scales?.['y']?.stacked).toBe(true);
  });

  it('turns the bars and drops the value axis when asked for a horizontal chart', () => {
    const horizontal = ChartTheme.baseOptions({ horizontal: true });

    expect(horizontal.indexAxis).toBe('y');
    expect(horizontal.scales?.['y']?.grid?.display).toBe(false);
  });

  it('drops the legend on request, because a single series is named by its title', () => {
    expect(ChartTheme.baseOptions({ legend: false }).plugins?.legend?.display).toBe(false);
    expect(ChartTheme.baseOptions().plugins?.legend?.display).toBe(true);
  });
});
