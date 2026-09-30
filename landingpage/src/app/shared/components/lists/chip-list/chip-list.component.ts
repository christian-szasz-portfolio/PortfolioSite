import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TechIconComponent } from '../../marks/tech-icon/tech-icon.component';

/** A row of technology tags */
@Component({
  selector: 'lpg-chip-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechIconComponent],
  templateUrl: './chip-list.component.html',
  styleUrl: './chip-list.component.scss',
})
export class ChipListComponent {
  public readonly items = input.required<readonly string[]>();
  /** Describes the set for assistive tech, since the tags alone lack context */
  public readonly label = input('Technologies');
}
