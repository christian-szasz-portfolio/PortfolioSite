import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ChartConfig } from '../../../core/utils/chart-config/chart-config.utils';
import { UsageDay } from '../../../data';
import { ChartComponent } from '../../../shared/components/chart/chart.component';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** Views a day: the panel, and the days it is drawn from. */
@Component({
  selector: 'adm-views-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent, PanelComponent],
  templateUrl: './views-chart.component.html',
  styleUrl: './views-chart.component.scss',
})
export class ViewsChartComponent {
  public readonly days = input.required<readonly UsageDay[]>();

  protected readonly config = computed(() => ChartConfig.views(this.days()));
}
