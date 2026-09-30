import { Directive, ElementRef, computed, inject, signal } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { MathUtils } from '../../../core/utils/math/math.utils';

const PULL = 0.22;
const MAX_TRAVEL = 8;

/** A control that drifts a little toward the pointer while it is over it */
@Directive({
  selector: '[lpgMagnetic]',
  host: {
    '[style.--pull-x]': 'pullX()',
    '[style.--pull-y]': 'pullY()',
    '(pointermove)': 'onMove($event)',
    '(pointerleave)': 'reset()',
    '(blur)': 'reset()',
  },
})
export class MagneticDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);

  private readonly offset = signal({ x: 0, y: 0 });

  protected readonly pullX = computed(() => `${this.offset().x.toFixed(2)}px`);
  protected readonly pullY = computed(() => `${this.offset().y.toFixed(2)}px`);

  protected onMove(event: PointerEvent): void {
    if (!this.environment.pointerEffectsEnabled()) {
      return;
    }

    const rect = this.host.nativeElement.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);

    this.offset.set({
      x: MathUtils.clampAround(dx * PULL, MAX_TRAVEL),
      y: MathUtils.clampAround(dy * PULL, MAX_TRAVEL),
    });
  }

  protected reset(): void {
    this.offset.set({ x: 0, y: 0 });
  }
}
