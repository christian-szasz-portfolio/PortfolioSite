import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ChartTheme } from '../../core/utils/chart-theme/chart-theme.utils';
import { Overview, TargetCheck } from '../../data';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CountriesChartComponent } from './countries-chart/countries-chart.component';
import { DaysTableComponent } from './days-table/days-table.component';
import { HealthPanelComponent } from './health-panel/health-panel.component';
import { OperationsChartComponent } from './operations-chart/operations-chart.component';
import { OperationsTableComponent } from './operations-table/operations-table.component';
import { ViewsChartComponent } from './views-chart/views-chart.component';

/** The archive, laid out; every panel is handed the slice it draws. */
@Component({
  selector: 'adm-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CountriesChartComponent,
    DaysTableComponent,
    HealthPanelComponent,
    OperationsChartComponent,
    OperationsTableComponent,
    StatCardComponent,
    ViewsChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  public readonly overview = input.required<Overview>();

  /** One row per deployed service, as far as asking it has got. */
  public readonly health = input<readonly TargetCheck[]>([]);

  /** True while any service is being asked. */
  public readonly checking = input(false);

  /** Pressed. The shell decides what asking means. */
  public readonly check = output<void>();

  /** Nothing archived yet is a sentence, not an empty chart. */
  protected readonly empty = computed(() => this.overview().days.length === 0);

  protected readonly viewsAccent = ChartTheme.seriesColour(0);
  protected readonly interactionsAccent = ChartTheme.seriesColour(1);
  protected readonly daysAccent = ChartTheme.seriesColour(2);
  protected readonly totalAccent = ChartTheme.seriesColour(3);
}
