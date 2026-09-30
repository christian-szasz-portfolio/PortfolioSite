import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import { projects } from '../../../../data/projects';
import { ZoomInput } from '../../../../core/utils/zoom/zoom.utils';
import { TreeLayoutUtils, TreeNode } from '../../../../core/utils/tree-layout/tree-layout.utils';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';

/** What a row and a column are worth, in pixels */
const ROW = 46;
const COLUMN = 210;
const NODE_WIDTH = 168;
const NODE_HEIGHT = 32;
const PADDING = 16;

/** Zoom bounds and step */
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;
const STEP = 0.15;

/** The site as a tree; real links over SVG connectors, so entries stay focusable and readable */
@Component({
  selector: 'lpg-sitemap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // On the host, not the canvas, which only gets keys while it holds focus
    '(keydown)': 'zoomInput.onKey($event)',
  },
  imports: [ModalShellComponent, RouterLink, ZoomControlsComponent],
  templateUrl: './sitemap.component.html',
  styleUrl: './sitemap.component.scss',
})
export class SitemapComponent {
  private readonly dialogRef = inject<MatDialogRef<SitemapComponent>>(MatDialogRef);

  private readonly tree: TreeNode = {
    label: 'Home',
    route: '/',
    fragment: 'top',
    children: [
      {
        label: 'Work',
        route: '/',
        fragment: 'work',
        children: projects.map((project) => ({
          label: project.title,
          route: `/work/${project.slug}`,
        })),
      },
      { label: 'Thinking', route: '/', fragment: 'thinking' },
      { label: 'About', route: '/', fragment: 'about' },
      { label: 'CV', route: '/cv' },
      { label: 'Privacy', route: '/privacy' },
      { label: 'Terms', route: '/terms' },
    ],
  };

  protected readonly layout = computed(() => TreeLayoutUtils.layOutTree(this.tree));

  protected readonly width = computed(() => (this.layout().depth + 1) * COLUMN + PADDING * 2);
  protected readonly height = computed(() => this.layout().rows * ROW + PADDING * 2);

  protected readonly placed = computed(() =>
    this.layout().nodes.map((node) => ({
      ...node,
      left: PADDING + node.depth * COLUMN,
      top: PADDING + node.row * ROW + (ROW - NODE_HEIGHT) / 2,
    })),
  );

  /** An elbow: out of the parent, across, then into the child */
  protected readonly connectors = computed(() =>
    this.layout().edges.map((edge) => {
      const startX = PADDING + edge.from.depth * COLUMN + NODE_WIDTH;
      const startY = PADDING + edge.from.row * ROW + ROW / 2;
      const endX = PADDING + edge.to.depth * COLUMN;
      const endY = PADDING + edge.to.row * ROW + ROW / 2;
      const midX = startX + (endX - startX) / 2;

      return `M${startX} ${startY} H${midX} V${endY} H${endX}`;
    }),
  );

  protected readonly nodeWidth = NODE_WIDTH;
  protected readonly nodeHeight = NODE_HEIGHT;

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  protected readonly zoom = signal(1);

  /** Ctrl and a wheel zooms, a plain wheel pans, and the browser's own shortcuts are taken */
  protected readonly zoomInput = new ZoomInput({
    nudge: (direction) => this.nudge(direction),
    reset: () => this.setZoom(1),
  });

  /** The stage carries the scaled size, so the scrollbars know how far to go */
  protected readonly stageWidth = computed(() => this.width() * this.zoom());
  protected readonly stageHeight = computed(() => this.height() * this.zoom());

  /** Left untransformed at 1, so the tree is not rasterised needlessly */
  protected readonly canvasTransform = computed(() =>
    this.zoom() === 1 ? 'none' : `scale(${this.zoom()})`,
  );

  protected nudge(direction: number): void {
    this.setZoom(this.zoom() + direction * STEP);
  }

  /** Scales the tree to the width available */
  protected fit(): void {
    const available = this.viewport().nativeElement.clientWidth - PADDING * 2;
    this.setZoom(available > 0 ? available / this.width() : 1);
  }

  public close(): void {
    this.dialogRef.close();
  }

  private setZoom(next: number): void {
    this.zoom.set(Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM));
  }
}
