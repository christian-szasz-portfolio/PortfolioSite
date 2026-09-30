import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RevealDirective } from '../../../directives/reveal/reveal.directive';
import { SplitTextDirective } from '../../../directives/split-text/split-text.directive';

/** The eyebrow, heading and standfirst that open a section */
@Component({
  selector: 'lpg-section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, SplitTextDirective],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
})
export class SectionHeaderComponent {
  public readonly eyebrow = input.required<string>();
  public readonly heading = input.required<string>();
  public readonly lede = input.required<string>();
}
