import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrowserEnvironment, ControlGlyphs, ScrollService } from '@christian-szasz-portfolio/common-web';

import { ClipPlayback } from '../../../../core/utils/clip-playback/clip-playback.utils';
import { MediaDialogService } from '../../../../core/services/dialogs/media-dialog/media-dialog.service';
import { MathUtils } from '../../../../core/utils/math/math.utils';
import { TiltDirective, TiltStrength } from '../../../directives/tilt/tilt.directive';
import { PlayToggleComponent } from '../play-toggle/play-toggle.component';

const VISIBILITY_THRESHOLD = 0.45;
const DRIFT_PX = 16;

/** A screenshot in window chrome, with a clip that plays over it while on screen */
@Component({
  selector: 'lpg-media-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TiltDirective, NgOptimizedImage, PlayToggleComponent],
  templateUrl: './media-frame.component.html',
  styleUrl: './media-frame.component.scss',
})
export class MediaFrameComponent {
  protected readonly glyphs = ControlGlyphs;

  public readonly poster = input.required<string>();
  public readonly alt = input.required<string>();
  public readonly label = input.required<string>();
  public readonly clip = input<string | null>(null);
  public readonly tilt = input<TiltStrength>(TiltStrength.Strong);
  /** Ties this frame to the same picture on the next route */
  public readonly transitionName = input<string | undefined>(undefined);

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private readonly environment = inject(BrowserEnvironment);
  private readonly scroll = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mediaDialog = inject(MediaDialogService);

  private readonly onScreen = signal(false);
  /** Set once the visitor presses pause, and never cleared by scrolling */
  private readonly suppressed = signal(false);
  private rect: DOMRect | null = null;

  protected readonly playback = new ClipPlayback(() => this.video()?.nativeElement);

  /** A slow vertical drift, derived from the shared scroll reading */
  protected readonly drift = computed(() => {
    if (!this.environment.animationsEnabled() || !this.onScreen()) {
      return 0;
    }

    const { viewport } = this.scroll.state();
    const rect = this.rect;
    if (rect === null || viewport === 0) {
      return 0;
    }

    const centre = rect.top + rect.height / 2;
    return Number(
      MathUtils.mapRange(centre, -rect.height, viewport + rect.height, DRIFT_PX, -DRIFT_PX).toFixed(
        1,
      ),
    );
  });

  public constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.rect = entry.boundingClientRect;
            const visible = entry.isIntersecting && entry.intersectionRatio >= VISIBILITY_THRESHOLD;
            this.onScreen.set(visible);
            this.syncPlayback(visible);
          }
        },
        { threshold: [0, VISIBILITY_THRESHOLD, 1] },
      );

      observer.observe(this.frame().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Opens the same picture large, in a pop-up */
  protected expand(): void {
    if (!this.environment.isBrowser) {
      return;
    }

    this.mediaDialog
      .open({ poster: this.poster(), alt: this.alt(), label: this.label(), clip: this.clip() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected togglePlayback(): void {
    if (this.playback.playing()) {
      this.suppressed.set(true);
      this.playback.stop();
      return;
    }

    this.suppressed.set(false);
    this.play();
  }

  private syncPlayback(visible: boolean): void {
    if (this.clip() === null) {
      return;
    }

    if (!visible) {
      this.playback.stop();
      return;
    }

    if (this.suppressed() || !this.environment.animationsEnabled()) {
      return;
    }
    this.play();
  }

  private play(): void {
    this.playback.start().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
