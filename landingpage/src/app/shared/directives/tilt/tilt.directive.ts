import { Directive, ElementRef, computed, inject, input, signal } from '@angular/core';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { MathUtils } from '../../../core/utils/math/math.utils';

export enum TiltStrength {
  Strong = 'strong',
  Soft = 'soft',
}

interface TiltSettings {
  readonly max: number;
  readonly lift: number;
}

const SETTINGS: Record<TiltStrength, TiltSettings> = {
  [TiltStrength.Strong]: { max: 3.6, lift: -6 },
  [TiltStrength.Soft]: { max: 2, lift: -4 },
};

/** Tilts toward the pointer, publishing the angles as custom properties */
@Directive({
  selector: '[lpgTilt]',
  host: {
    '[class.is-tilting]': 'hovering()',
    '[style.--tilt-x]': 'tiltX()',
    '[style.--tilt-y]': 'tiltY()',
    '[style.--tilt-lift]': 'lift()',
    '[style.--glare-x]': 'glareX()',
    '[style.--glare-y]': 'glareY()',
    '(pointerenter)': 'onEnter()',
    '(pointermove)': 'onMove($event)',
    '(pointerleave)': 'onLeave()',
  },
})
export class TiltDirective {
  /** A bare attribute arrives as an empty string, mapped here to the default */
  public readonly lpgTilt = input<TiltStrength, TiltStrength | ''>(TiltStrength.Strong, {
    transform: (value: TiltStrength | ''): TiltStrength =>
      value === '' ? TiltStrength.Strong : value,
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environment = inject(BrowserEnvironment);

  private readonly settings = computed(() => SETTINGS[this.lpgTilt()]);
  private readonly rotation = signal({ x: 0, y: 0 });
  private readonly glare = signal({ x: 50, y: 50 });

  protected readonly hovering = signal(false);

  protected readonly tiltX = computed(() => `${this.rotation().x.toFixed(3)}deg`);
  protected readonly tiltY = computed(() => `${this.rotation().y.toFixed(3)}deg`);
  protected readonly glareX = computed(() => `${this.glare().x.toFixed(1)}%`);
  protected readonly glareY = computed(() => `${this.glare().y.toFixed(1)}%`);
  protected readonly lift = computed(() => (this.hovering() ? `${this.settings().lift}px` : '0px'));

  protected onEnter(): void {
    if (!this.environment.pointerEffectsEnabled()) {
      return;
    }
    this.hovering.set(true);
  }

  protected onMove(event: PointerEvent): void {
    if (!this.environment.pointerEffectsEnabled()) {
      return;
    }

    const rect = this.host.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    const { max } = this.settings();

    // Rotation about X responds to vertical travel, hence the swap.
    this.rotation.set({
      x: MathUtils.clampAround(-py * max * 2, max),
      y: MathUtils.clampAround(px * max * 2, max),
    });
    this.glare.set({ x: (px + 0.5) * 100, y: (py + 0.5) * 100 });
  }

  protected onLeave(): void {
    this.hovering.set(false);
    this.rotation.set({ x: 0, y: 0 });
  }
}
