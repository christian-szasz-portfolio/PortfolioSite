import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChartConfig } from '../../../core/utils/chart-config/chart-config.utils';
import { ViewSnapshot } from '../../../data';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** Where the running total came from: one bar, cut into its parts. */
@Component({
  selector: 'adm-countries-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent, PanelComponent],
  templateUrl: './countries-chart.component.html',
  styleUrl: './countries-chart.component.scss',
})
export class CountriesChartComponent {
  public readonly snapshot = input.required<ViewSnapshot>();

  /** The day the counter was read, since this total is not tied to the days beside it. */
  protected readonly note = computed(
    () =>
      `The running total since the counter began, taken ${this.snapshot().takenAt.slice(0, 10)}.`,
  );

  protected readonly config = computed(() => ChartConfig.countries(this.snapshot()));
}
