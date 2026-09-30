import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

/** How an element arrives. The drawing of each one lives in the global stylesheet. */
export enum RevealVariant {
  Rise = 'rise',
  Fade = 'fade',
  Scale = 'scale',
  Mask = 'mask',
  SlideLeft = 'slide-left',
  SlideRight = 'slide-right',
}

/** What a bare `lpgReveal` means */
export const defaultReveal: RevealVariant = RevealVariant.Rise;

/** Reveals an element the first time it scrolls into view */
@Directive({
  selector: '[lpgReveal]',
  host: {
    '[class.is-revealed]': 'revealed()',
    '[class.is-reveal-armed]': 'armed()',
    '[attr.data-reveal]': 'lpgReveal()',
    '[style.--reveal-delay.ms]': 'revealDelay()',
  },
})
export class RevealDirective {
  /** A bare attribute arrives as an empty string, mapped here to the default */
  public readonly lpgReveal = input<RevealVariant, RevealVariant | ''>(defaultReveal, {
    transform: (value: RevealVariant | ''): RevealVariant => (value === '' ? defaultReveal : value),
  });

  /** Held back by this much once it has been asked to arrive */
  public readonly revealDelay = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly revealed = signal(false);
  protected readonly armed = signal(false);

  public constructor() {
    afterNextRender(() => {
      if (!this.environment.animationsEnabled()) {
        this.revealed.set(true);
        return;
      }

      this.armed.set(true);

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }
            this.revealed.set(true);
            observer.disconnect();
          }
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
