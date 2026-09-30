import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChartConfig } from '../../../core/utils/chart-config/chart-config.utils';
import { UsageDay, UsageOperation } from '../../../data';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** What people did: stacked bars over days, and a pie when there is only one. */
@Component({
  selector: 'adm-operations-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent, PanelComponent],
  templateUrl: './operations-chart.component.html',
  styleUrl: './operations-chart.component.scss',
})
export class OperationsChartComponent {
  public readonly days = input.required<readonly UsageDay[]>();

  /** The operations across the whole archive, busiest first, which decides who gets a slot. */
  public readonly operations = input.required<readonly UsageOperation[]>();

  protected readonly config = computed(() =>
    ChartConfig.operations(this.days(), this.operations()),
  );

  /** The note has to follow the shape, or it promises a comparison the pie is not making. */
  protected readonly note = computed(() =>
    this.days().length < 2
      ? 'The one day held, cut into the operations it was made of.'
      : 'Each day, cut into the operations it was made of.',
  );
}
