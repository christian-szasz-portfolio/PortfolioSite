import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Stat } from '../../../../data/content.types';
import { CounterDirective } from '../../../directives/counter/counter.directive';

/** The figures under the hero, each counting up when it first comes into view */
@Component({
  selector: 'lpg-stat-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CounterDirective],
  templateUrl: './stat-list.component.html',
  styleUrl: './stat-list.component.scss',
})
export class StatListComponent {
  public readonly stats = input.required<readonly Stat[]>();
}
