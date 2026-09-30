import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ControlGlyphs } from '@christian-szasz-portfolio/common-web';

/** Zoom out, the level, zoom in and Fit: the group every zoomable pop-up puts in its toolbar */
@Component({
  selector: 'lpg-zoom-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zoom-controls.component.html',
  styleUrl: './zoom-controls.component.scss',
})
export class ZoomControlsComponent {
  protected readonly glyphs = ControlGlyphs;

  /** The current zoom, 1 being true size */
  public readonly level = input.required<number>();

  public readonly zoomOut = output<void>();
  public readonly zoomIn = output<void>();
  public readonly fit = output<void>();

  protected readonly percentage = computed(() => `${Math.round(this.level() * 100)}%`);
}
