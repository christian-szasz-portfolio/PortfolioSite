import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ClipPlayback } from '../../../../core/utils/clip-playback/clip-playback.utils';
import { PlayToggleComponent, PlayToggleVariant } from '../../media/play-toggle/play-toggle.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/** What the larger view is handed: the same picture the frame already has */
export interface MediaViewerData {
  readonly poster: string;
  readonly alt: string;
  readonly label: string;
  readonly clip: string | null;
}

/** The frame's picture opened large; nothing is fetched or moving until a deliberate press */
@Component({
  selector: 'lpg-media-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent, PlayToggleComponent],
  templateUrl: './media-viewer.component.html',
  styleUrl: './media-viewer.component.scss',
})
export class MediaViewerComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly variants = PlayToggleVariant;

  protected readonly data = inject<MediaViewerData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<MatDialogRef<MediaViewerComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected readonly closeLabel = $localize`:@@media.viewer.close.cta:Close the larger view`;

  protected readonly playback = new ClipPlayback(() => this.video()?.nativeElement);

  public close(): void {
    this.dialogRef.close();
  }

  protected togglePlayback(): void {
    if (this.playback.playing()) {
      this.playback.stop();
      return;
    }

    this.playback.start().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
