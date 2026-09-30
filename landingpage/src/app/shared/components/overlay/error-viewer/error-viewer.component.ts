import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { ErrorDialogService } from '../../../../core/services/dialogs/error-dialog/error-dialog.service';
import type { ErrorReport } from '../../../../core/services/platform/error-handler/error-report';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/** A failure, shown in full while developing and as a question to the visitor otherwise. */
@Component({
  selector: 'lpg-error-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent],
  templateUrl: './error-viewer.component.html',
  styleUrl: './error-viewer.component.scss',
})
export class ErrorViewerComponent {
  private readonly dialogRef = inject<MatDialogRef<ErrorViewerComponent>>(MatDialogRef);
  private readonly errors = inject(ErrorDialogService);
  private readonly environment = inject(BrowserEnvironment);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly report = inject<ErrorReport>(MAT_DIALOG_DATA);

  /** Untranslated while developing: nobody reads a stack trace in their second language. */
  protected readonly heading = this.report.detailed
    ? 'Something threw'
    : $localize`:@@error.title:Now things got weird`;

  protected readonly closeLabel = $localize`:@@error.close.cta:Close`;

  public constructor() {
    // However it closed, including the backdrop, the next failure may be shown.
    this.destroyRef.onDestroy(() => this.errors.closed());
  }

  protected dismiss(): void {
    this.dialogRef.close();
  }

  protected reload(): void {
    this.environment.window?.location.reload();
  }
}
