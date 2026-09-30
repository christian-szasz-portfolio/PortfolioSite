import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RevealDirective, RevealVariant } from '../../../directives/reveal/reveal.directive';
import { SplitTextDirective } from '../../../directives/split-text/split-text.directive';

/** The one first-level heading a page is allowed, with what sits around it */
@Component({
  selector: 'lpg-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, SplitTextDirective],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly reveals = RevealVariant;

  public readonly heading = input.required<string>();
  public readonly eyebrow = input<string | undefined>(undefined);
  public readonly meta = input<string | undefined>(undefined);
  public readonly lede = input<string | undefined>(undefined);
  /** Centres the header: the 404 and the legal pages ask for it */
  public readonly centred = input(false);
}
