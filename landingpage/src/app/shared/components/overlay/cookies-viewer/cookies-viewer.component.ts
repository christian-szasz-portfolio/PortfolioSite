import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { CookiesContentComponent } from '../../legal/cookies-content/cookies-content.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/** The cookies-and-storage text, shown in a pop-up. */
@Component({
  selector: 'lpg-cookies-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CookiesContentComponent, ModalShellComponent],
  templateUrl: './cookies-viewer.component.html',
  styleUrl: './cookies-viewer.component.scss',
})
export class CookiesViewerComponent {
  private readonly dialogRef = inject<MatDialogRef<CookiesViewerComponent>>(MatDialogRef);

  public close(): void {
    this.dialogRef.close();
  }
}
