import { DestroyRef, Directive, ElementRef, LOCALE_ID, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { MathUtils } from '../../../core/utils/math/math.utils';

const DURATION_MS = 1400;

/** Counts a figure up the first time it comes into view */
@Directive({
  selector: '[lpgCounter]',
  host: {
    '[textContent]': 'display()',
  },
})
export class CounterDirective {
  public readonly lpgCounter = input.required<number>();
  /** True for values that are not quantities, such as a year */
  public readonly plain = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  private readonly value = signal<number | null>(null);

  /** Grouped the way the reader's language groups, not the way English does. */
  private readonly formatter = new Intl.NumberFormat(inject(LOCALE_ID));

  protected readonly display = computed(() => {
    const shown = this.value() ?? this.lpgCounter();
    return this.plain() ? String(shown) : this.formatter.format(shown);
  });

  public constructor() {
    afterNextRender(() => {
      if (!this.environment.animationsEnabled()) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }
            observer.disconnect();
            this.run();
          }
        },
        { threshold: 0.6 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private run(): void {
    const target = this.lpgCounter();
    const from = this.plain() ? Math.max(0, target - 12) : 0;
    const started = performance.now();
    let frame = 0;

    const step = (now: number): void => {
      const progress = Math.min((now - started) / DURATION_MS, 1);
      this.value.set(Math.round(from + (target - from) * MathUtils.easeOutCubic(progress)));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        this.value.set(null); // back to the declared value, exactly
      }
    };

    frame = requestAnimationFrame(step);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));
  }
}
