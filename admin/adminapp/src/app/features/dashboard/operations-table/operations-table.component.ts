import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SeriesSlots } from '../../../core/utils/series-slots/series-slots.utils';
import { UsageOperation } from '../../../data';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** Every operation and its total, so identity never rests on colour alone. */
@Component({
  selector: 'adm-operations-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelComponent],
  templateUrl: './operations-table.component.html',
  styleUrl: './operations-table.component.scss',
})
export class OperationsTableComponent {
  public readonly operations = input.required<readonly UsageOperation[]>();

  private readonly order = computed(() =>
    SeriesSlots.order(this.operations().map((operation) => operation.name)),
  );

  protected colour(name: string): string {
    return SeriesSlots.colour(name, this.order());
  }
}
