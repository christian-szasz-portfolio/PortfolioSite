import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect, computed, inject, signal, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ZoomInput } from '../../../../core/utils/zoom/zoom.utils';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';

/** What the larger view is handed: the drawing the figure already shows, and its size */
export interface DiagramViewerData {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly width: number;
  readonly height: number;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const STEP = 0.15;

/** The viewport's padding on both sides, which fitting must leave free */
const GUTTER = 32;

/** A point in the viewport held still while the zoom changes under it */
interface Anchor {
  /** Where it sits in the viewport, in screen pixels */
  readonly x: number;
  readonly y: number;
  /** The point of the drawing under it, in the drawing's own units */
  readonly drawingX: number;
  readonly drawingY: number;
}

/** Where a drag started, so each move is measured from there rather than accumulated */
interface DragStart {
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly scrollLeft: number;
  readonly scrollTop: number;
}

/** A case-study diagram opened large: zoom, fit, and pan by dragging or scrolling */
@Component({
  selector: 'lpg-diagram-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent, ZoomControlsComponent],
  host: {
    // On the host, not the viewport, which only gets keys while it holds focus
    '(keydown)': 'zoomInput.onKey($event)',
  },
  templateUrl: './diagram-viewer.component.html',
  styleUrl: './diagram-viewer.component.scss',
})
export class DiagramViewerComponent {
  protected readonly data = inject<DiagramViewerData>(MAT_DIALOG_DATA);

  protected readonly closeLabel = $localize`:@@diagram.viewer.close.cta:Close the diagram`;

  private readonly dialogRef = inject<MatDialogRef<DiagramViewerComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly zoom = signal(1);
  protected readonly dragging = signal(false);

  /** A wheel zooms around the pointer; 0 fits, since a drawing has no true size to return to */
  protected readonly zoomInput = new ZoomInput({
    nudge: (direction, event) => this.nudge(direction, event),
    reset: () => this.fit(),
  });

  /** The drawing is vector, so it is resized rather than scaled and stays sharp at any zoom */
  protected readonly stageWidth = computed(() => `${Math.round(this.data.width * this.zoom())}px`);
  protected readonly stageHeight = computed(
    () => `${Math.round(this.data.height * this.zoom())}px`,
  );

  private anchor: Anchor | null = null;
  private drag: DragStart | null = null;

  /** Fitted until the reader zooms; while fitted, the drawing follows the viewport's size */
  private fitted = true;

  public constructor() {
    // The dialog is still opening when it first renders, so its size is only known later
    afterNextRender(() => {
      const viewport = this.viewport().nativeElement;
      const observer = new ResizeObserver(() => {
        if (this.fitted) {
          this.fit();
        }
      });
      observer.observe(viewport);
      this.destroyRef.onDestroy(() => observer.disconnect());

      viewport.focus({ preventScroll: true });
    });

    // Once the stage has its new size, scroll so the anchored point is back where it was
    afterRenderEffect(() => {
      const zoom = this.zoom();
      const anchor = this.anchor;
      if (anchor === null) {
        return;
      }

      this.anchor = null;
      const viewport = this.viewport().nativeElement;
      const stage = this.stage().nativeElement;
      viewport.scrollLeft = anchor.drawingX * zoom + stage.offsetLeft - anchor.x;
      viewport.scrollTop = anchor.drawingY * zoom + stage.offsetTop - anchor.y;
    });
  }

  public close(): void {
    this.dialogRef.close();
  }

  /** A wheel names the point to hold still; a button or a key zooms about the centre */
  protected nudge(direction: number, event?: WheelEvent): void {
    const next = this.zoom() + direction * STEP;
    if (event === undefined) {
      this.zoomAround(next);
      return;
    }

    const bounds = this.viewport().nativeElement.getBoundingClientRect();
    this.zoomAround(next, event.clientX - bounds.left, event.clientY - bounds.top);
  }

  /** The whole drawing in view, whichever side runs out of room first */
  protected fit(): void {
    const viewport = this.viewport().nativeElement;
    const across = (viewport.clientWidth - GUTTER) / this.data.width;
    const down = (viewport.clientHeight - GUTTER) / this.data.height;
    const scale = Math.min(across, down);

    this.fitted = true;
    this.anchor = null;
    this.zoom.set(this.clamp(scale > 0 ? scale : 1));
  }

  /** A mouse or pen drags the drawing; touch keeps the browser's own panning */
  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch' || event.button !== 0) {
      return;
    }

    const viewport = this.viewport().nativeElement;
    viewport.setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    this.dragging.set(true);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }

    const viewport = this.viewport().nativeElement;
    viewport.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    viewport.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  }

  protected onPointerEnd(): void {
    this.drag = null;
    this.dragging.set(false);
  }

  /** Changes the zoom and keeps the point at (x, y) of the viewport still; the centre by default */
  private zoomAround(next: number, x?: number, y?: number): void {
    const zoom = this.clamp(next);
    const current = this.zoom();
    this.fitted = false;
    if (zoom === current) {
      return;
    }

    const viewport = this.viewport().nativeElement;
    const stage = this.stage().nativeElement;
    const anchorX = x ?? viewport.clientWidth / 2;
    const anchorY = y ?? viewport.clientHeight / 2;

    this.anchor = {
      x: anchorX,
      y: anchorY,
      drawingX: (viewport.scrollLeft + anchorX - stage.offsetLeft) / current,
      drawingY: (viewport.scrollTop + anchorY - stage.offsetTop) / current,
    };
    this.zoom.set(zoom);
  }

  private clamp(zoom: number): number {
    return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
  }
}
