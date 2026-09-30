import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { TechIconComponent } from '../../marks/tech-icon/tech-icon.component';

/** Roughly how fast the ticker should travel, in pixels per second */
const SPEED = 46;
/** Enough to estimate a track width without measuring the DOM */
const APPROX_ITEM_PX = 150;

/** An infinite ticker */
@Component({
  selector: 'lpg-marquee',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechIconComponent],
  templateUrl: './marquee.component.html',
  styleUrl: './marquee.component.scss',
})
export class MarqueeComponent {
  public readonly items = input.required<readonly string[]>();
  public readonly reverse = input(false);

  private readonly environment = inject(BrowserEnvironment);

  /**
   * Each copy slides by its own width, so the band stays full while the copies after the
   * first cover the viewport: three copies fill a screen up to twice as wide as one row.
   */
  protected readonly copies = [0, 1, 2];

  protected readonly running = computed(() => this.environment.animationsEnabled());
  protected readonly duration = computed(
    () => `${((this.items().length * APPROX_ITEM_PX) / SPEED).toFixed(1)}s`,
  );
}
