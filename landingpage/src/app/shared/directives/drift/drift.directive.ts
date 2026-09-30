import { DestroyRef, Directive, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { BrowserEnvironment, ScrollService } from '@christian-szasz-portfolio/common-web';

import { MathUtils } from '../../../core/utils/math/math.utils';

export enum DriftDepth {
  Soft = 'soft',
  Medium = 'medium',
  Strong = 'strong',
}

/** How far, in pixels, each depth travels either side of centre */
const TRAVEL: Readonly<Record<DriftDepth, number>> = {
  [DriftDepth.Soft]: 8,
  [DriftDepth.Medium]: 18,
  [DriftDepth.Strong]: 32,
};

/** Publishes a viewport-relative scroll offset as --drift; the stylesheet decides its use */
@Directive({
  selector: '[lpgDrift]',
  host: {
    '[style.--drift.px]': 'offset()',
  },
})
export class DriftDirective {
  /** A bare attribute arrives as an empty string, mapped here to the default */
  public readonly lpgDrift = input<DriftDepth, DriftDepth | ''>(DriftDepth.Medium, {
    transform: (value: DriftDepth | ''): DriftDepth => (value === '' ? DriftDepth.Medium : value),
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);
  private readonly scroll = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);

  /** Off screen there is nothing worth measuring, so nothing is measured */
  private readonly onScreen = signal(false);

  protected readonly offset = computed(() => {
    if (!this.environment.animationsEnabled() || !this.onScreen()) {
      return 0;
    }

    const { viewport } = this.scroll.state();
    if (viewport === 0) {
      return 0;
    }

    // Read now rather than cached, so the offset follows the element itself.
    const rect = this.host.nativeElement.getBoundingClientRect();
    if (rect.height === 0) {
      return 0;
    }

    const travel = TRAVEL[this.lpgDrift()];
    const centre = rect.top + rect.height / 2;

    return Number(
      MathUtils.mapRange(centre, -rect.height, viewport + rect.height, travel, -travel).toFixed(1),
    );
  });

  public constructor() {
    afterNextRender(() => {
      if (!this.environment.animationsEnabled()) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.onScreen.set(entry.isIntersecting);
          }
        },
        { rootMargin: '20% 0px' },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
