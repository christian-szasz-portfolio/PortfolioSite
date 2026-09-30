import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { UsageDay } from '../../../data';
import { PanelComponent } from '../../../shared/components/panel/panel.component';

/** Every archived day and its four numbers, newest first, which is the order a person reads. */
@Component({
  selector: 'adm-days-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PanelComponent],
  templateUrl: './days-table.component.html',
  styleUrl: './days-table.component.scss',
})
export class DaysTableComponent {
  /** The days as the archive holds them, oldest first. */
  public readonly days = input.required<readonly UsageDay[]>();

  protected readonly newestFirst = computed(() => [...this.days()].reverse());
}
