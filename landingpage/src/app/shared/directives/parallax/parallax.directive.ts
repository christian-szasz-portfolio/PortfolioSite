import { Directive, computed, inject, input } from '@angular/core';
import { BrowserEnvironment, ScrollService } from '@christian-szasz-portfolio/common-web';

/** Moves an element against the scroll, at a rate of its own */
@Directive({
  selector: '[lpgParallax]',
  host: {
    '[style.transform]': 'transform()',
  },
})
export class ParallaxDirective {
  /** The fraction of the scroll this element travels, signed for direction */
  public readonly lpgParallax = input.required<number>();

  private readonly scroll = inject(ScrollService);
  private readonly environment = inject(BrowserEnvironment);

  protected readonly transform = computed(() =>
    this.environment.animationsEnabled()
      ? `translate3d(0, ${(this.scroll.state().y * this.lpgParallax()).toFixed(1)}px, 0)`
      : 'none',
  );
}
