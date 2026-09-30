import { ChangeDetectionStrategy, Component, DOCUMENT, afterNextRender, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ArrowGlyphs, BrowserEnvironment, CircuitFieldComponent, PointerService, WifiGlyphs } from '@christian-szasz-portfolio/common-web';

import { stats } from '../../../data';
import { MagneticDirective } from '../../../shared/directives/magnetic/magnetic.directive';
import { ParallaxDirective } from '../../../shared/directives/parallax/parallax.directive';
import { SplitTextDirective } from '../../../shared/directives/split-text/split-text.directive';
import { StatListComponent } from '../../../shared/components/lists/stat-list/stat-list.component';
import { ViewCounterComponent } from '../../../shared/components/lists/view-counter/view-counter.component';

const RESTING_GLOW = { x: '26%', y: '30%' } as const;

/** The opening statement, with its staggered entrance */
@Component({
  selector: 'lpg-hero-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CircuitFieldComponent,
    MagneticDirective,
    RouterLink,
    ParallaxDirective,
    SplitTextDirective,
    StatListComponent,
    ViewCounterComponent,
  ],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss',
})
export class HeroSectionComponent {
  protected readonly wifiGlyphs = WifiGlyphs;
  protected readonly arrowGlyphs = ArrowGlyphs;

  protected readonly stats = stats;

  private readonly pointer = inject(PointerService);
  private readonly environment = inject(BrowserEnvironment);
  private readonly document = inject(DOCUMENT);

  /** Drives the staggered entrance; see the motion rules in this stylesheet */
  protected readonly ready = signal(false);

  /** The hero light follows the pointer, as two percentages */
  private readonly glow = computed(() => {
    if (!this.environment.pointerEffectsEnabled()) {
      return RESTING_GLOW;
    }

    const view = this.environment.window;
    const position = this.pointer.position();
    if (view === null || !position.active) {
      return RESTING_GLOW;
    }

    return {
      x: `${((position.x / view.innerWidth) * 100).toFixed(2)}%`,
      y: `${((position.y / view.innerHeight) * 100).toFixed(2)}%`,
    };
  });

  protected readonly glowX = computed(() => this.glow().x);
  protected readonly glowY = computed(() => this.glow().y);

  public constructor() {
    // Armed after the first paint, so there is a state to transition from
    afterNextRender(() => {
      if (!this.environment.animationsEnabled()) {
        this.ready.set(true);
        return;
      }

      this.document.documentElement.classList.add('is-intro-ready');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.ready.set(true));
      });
    });
  }
}
