import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsService } from '@christian-szasz-portfolio/common-web';

import { ZoomInput } from '../../../../core/utils/zoom/zoom.utils';

import { switchMap } from 'rxjs';

import { interaction } from '../../../../data/interaction.data';
import { ArchiveService } from '../../../../core/services/cv/archive/archive.service';
import { CvExportService } from '../../../../core/services/cv/cv-export/cv-export.service';
import { DownloadService } from '../../../../core/services/cv/download/download.service';
import { PdfService } from '../../../../core/services/cv/pdf/pdf.service';
import { CvDocumentComponent } from '../../cv/cv-document/cv-document.component';
import { MenuDirective } from '../../../directives/menu/menu.directive';
import { MenuItemDirective } from '../../../directives/menu-item/menu-item.directive';
import { MenuTriggerDirective } from '../../../directives/menu-trigger/menu-trigger.directive';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';

/** The sheet is A4 at 96dpi until the rendered one has been measured */
const PAGE_WIDTH = 793.7;
const PAGE_HEIGHT = 1122.5;

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3;
const STEP = 0.15;

/** The contents of the CV pop-up */
@Component({
  selector: 'lpg-cv-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CvDocumentComponent,
    MenuDirective,
    MenuItemDirective,
    MenuTriggerDirective,
    ModalShellComponent,
    RouterLink,
    ZoomControlsComponent,
  ],
  host: {
    // On the host, not the viewport, which only gets keys while it holds focus
    '(keydown)': 'zoomInput.onKey($event)',
  },
  templateUrl: './cv-viewer.component.html',
  styleUrl: './cv-viewer.component.scss',
})
export class CvViewerComponent {
  protected readonly packing = signal(false);
  protected readonly packFailed = signal(false);
  protected readonly printing = signal(false);
  protected readonly printFailed = signal(false);

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly sheet = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly menu = viewChild.required(MenuDirective);

  private readonly dialogRef = inject<MatDialogRef<CvViewerComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly archive = inject(ArchiveService);
  private readonly exporter = inject(CvExportService);
  private readonly pdf = inject(PdfService);
  private readonly downloads = inject(DownloadService);
  private readonly analytics = inject(AnalyticsService);

  protected readonly zoom = signal(1);

  /** Ctrl and a wheel zooms, a plain wheel pans, and the browser's own shortcuts are taken */
  protected readonly zoomInput = new ZoomInput({
    nudge: (direction) => this.nudge(direction),
    reset: () => this.setZoom(1),
  });

  protected readonly page = signal({ width: PAGE_WIDTH, height: PAGE_HEIGHT });

  protected readonly stageWidth = computed(() => `${this.page().width * this.zoom()}px`);
  protected readonly stageHeight = computed(() => `${this.page().height * this.zoom()}px`);

  /** No transform at true size: scale(1) rasterises the layer and misaligns the sidebar */
  protected readonly sheetTransform = computed(() =>
    this.zoom() === 1 ? 'none' : `scale(${this.zoom()})`,
  );

  public constructor() {
    afterNextRender(() => {
      this.measure();

      // Below the A4 width there is no sensible default but fit-to-width.
      if (window.innerWidth < this.page().width + 96) {
        this.fit();
      }
      this.viewport().nativeElement.focus({ preventScroll: true });
    });
  }

  public close(): void {
    this.dialogRef.close();
  }

  /** Packs the sheet the reader is looking at, so the two cannot drift apart */
  public downloadSource(): void {
    if (this.packing()) {
      return;
    }

    this.packing.set(true);
    this.packFailed.set(false);

    this.exporter
      .collect(this.sheetElement())
      .pipe(
        switchMap((files) => this.archive.pack(files)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => {
          this.downloads.save(blob, 'cv-source.zip');
          // Counted where the file is actually saved, so a download that failed is not one
          this.analytics.record(interaction.cvSource);
          this.menu().close();
        },
        // A partial archive is worse than none, so nothing is handed over
        error: () => {
          this.packFailed.set(true);
          this.packing.set(false);
        },
        complete: () => this.packing.set(false),
      });
  }

  /** Renders straight to a PDF, skipping the print dialog; /cv still prints as real text */
  public downloadPdf(): void {
    if (this.printing()) {
      return;
    }

    this.printing.set(true);
    this.printFailed.set(false);

    this.pdf
      .render(this.sheetElement())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.downloads.save(blob, 'CV_Christian_Szasz.pdf');
          this.analytics.record(interaction.cvPdf);
          this.menu().close();
        },
        error: () => {
          this.printFailed.set(true);
          this.printing.set(false);
        },
        complete: () => this.printing.set(false),
      });
  }

  protected nudge(direction: number): void {
    this.setZoom(this.zoom() + direction * STEP);
  }

  /** Scales the page to the width available, which is what small screens need */
  protected fit(): void {
    const available = this.viewport().nativeElement.clientWidth - 32;
    this.setZoom(available > 0 ? available / this.page().width : 1);
  }

  /** The sheet the reader is looking at, before the viewer scales it */
  private sheetElement(): HTMLElement {
    return this.sheet().nativeElement;
  }

  /** offsetWidth, not getBoundingClientRect, which reports the size after transforms */
  private measure(): void {
    const element = this.sheetElement();
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (width > 0 && height > 0) {
      this.page.set({ width, height });
    }
  }

  private setZoom(next: number): void {
    this.zoom.set(Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM));
  }
}
