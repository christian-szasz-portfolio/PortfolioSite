import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

import { PanelChart } from '../../../core/utils/chart-theme/chart-theme.utils';

Chart.register(...registerables);

/** A canvas with a chart on it, and the only place that talks to the charting library. */
@Component({
  selector: 'adm-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
})
export class ChartComponent {
  /** What to draw. A new configuration replaces the chart rather than mutating it. */
  public readonly config = input.required<PanelChart>();

  /** What the canvas is, in words, for a reader who is not looking at it. */
  public readonly label = input.required<string>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly destroyRef = inject(DestroyRef);

  private chart: Chart | null = null;
  private ready = false;

  public constructor() {
    // The canvas only exists once the view is laid out, so nothing is drawn before this.
    afterNextRender(() => {
      this.ready = true;
      this.draw(this.config());
    });

    effect(() => {
      const config = this.config();

      if (this.ready) {
        this.draw(config);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.chart?.destroy();
      this.chart = null;
    });
  }

  /** A canvas with no 2d context cannot be drawn on, which is what a test run gives. */
  private draw(config: PanelChart): void {
    this.chart?.destroy();
    this.chart = null;

    const canvas = this.canvas().nativeElement;
    if (canvas.getContext('2d') === null) {
      return;
    }

    this.chart = new Chart(canvas, config);
  }
}
