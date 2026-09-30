import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

import { technologies } from '../../../data';
import { MarqueeComponent } from '../../../shared/components/media/marquee/marquee.component';

/** The two tickers of technologies, travelling in opposite directions */
@Component({
  selector: 'lpg-tech-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarqueeComponent],
  templateUrl: './tech-band.component.html',
  styleUrl: './tech-band.component.scss',
})
export class TechBandComponent {
  protected readonly rows = technologies;

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly band = viewChild.required<ElementRef<HTMLElement>>('band');

  public constructor() {
    // Published so an anchor jump knows what is in the way: this band sticks under the header,
    // so the offset is the header's height plus this one, read and added by the shell.
    afterNextRender(() => {
      const element = this.band().nativeElement;

      const publish = (): void => {
        // A detached band measures zero; skip it or the anchor offset comes up short.
        if (!element.isConnected) {
          return;
        }

        const height = Math.round(element.getBoundingClientRect().height);
        if (height === 0) {
          return;
        }

        this.document.documentElement.style.setProperty('--band-height', `${height}px`);
      };

      publish();

      const observer = new ResizeObserver(publish);
      observer.observe(element);

      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        // Off the home page there is no band, so nothing is in the way any more.
        this.document.documentElement.style.setProperty('--band-height', '0px');
      });
    });
  }
}
