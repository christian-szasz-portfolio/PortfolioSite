import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Fact } from '../../../../data/content.types';

/** Two columns of stated facts, scrollable rather than squeezed */
@Component({
  selector: 'lpg-spec-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spec-table.component.html',
  styleUrl: './spec-table.component.scss',
})
export class SpecTableComponent {
  public readonly rows = input.required<readonly Fact[]>();
  public readonly caption = input($localize`:@@specs.caption:Key facts`);
}
