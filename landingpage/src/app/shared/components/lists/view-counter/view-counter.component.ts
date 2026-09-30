import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ViewCounterService } from '@christian-szasz-portfolio/common-web';

import { IconComponent } from '../../marks/icon/icon.component';

/** How many people have been here: an eye, a rule, a number. */
@Component({
  selector: 'lpg-view-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './view-counter.component.html',
  styleUrl: './view-counter.component.scss',
})
export class ViewCounterComponent {
  private readonly counter = inject(ViewCounterService);

  protected readonly stats = this.counter.stats;

  /** What the eye means, for a pointer that hovers and for a reader who cannot see it. */
  protected readonly tip = $localize`:@@views.tip.text:Total views, counted once a day per browser`;

  public constructor() {
    this.counter.ensureLoaded();
  }
}
