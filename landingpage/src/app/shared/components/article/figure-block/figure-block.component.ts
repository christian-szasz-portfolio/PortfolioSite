import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrowserEnvironment, ControlGlyphs } from '@christian-szasz-portfolio/common-web';

import { DiagramDialogService } from '../../../../core/services/dialogs/diagram-dialog/diagram-dialog.service';

/** An illustration with its caption, lazily loaded and sized before it lands; a press opens it large */
@Component({
  selector: 'lpg-figure-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './figure-block.component.html',
  styleUrl: './figure-block.component.scss',
})
export class FigureBlockComponent {
  private readonly diagramDialog = inject(DiagramDialogService);
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  public readonly src = input.required<string>();
  public readonly srcSmall = input.required<string>();
  public readonly alt = input.required<string>();
  public readonly caption = input.required<string>();
  public readonly width = input.required<number>();
  public readonly height = input.required<number>();

  protected readonly glyphs = ControlGlyphs;

  /** The same two widths MediaFrameComponent offers, stated once */
  protected readonly srcset = computed(() => `${this.srcSmall()} 640w, ${this.src()} 1280w`);

  /** Reserves the box before the image arrives, so nothing shifts */
  protected readonly ratio = computed(() => `${this.width()} / ${this.height()}`);

  /** Opens the larger file in the zoomable pop-up */
  protected expand(): void {
    if (!this.environment.isBrowser) {
      return;
    }

    this.diagramDialog
      .open({
        src: this.src(),
        alt: this.alt(),
        caption: this.caption(),
        width: this.width(),
        height: this.height(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
