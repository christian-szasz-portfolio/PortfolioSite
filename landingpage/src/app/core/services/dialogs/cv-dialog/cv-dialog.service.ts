import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Opens the CV; MatDialog supplies the focus trap, backdrop and scroll block */
@Service()
export class CvDialogService {
  private readonly dialog = inject(DialogService);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(): Observable<void> {
    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/cv-viewer/cv-viewer.component'),
      (module) => module.CvViewerComponent,
      {
        panelClass: 'cv-dialog',
        backdropClass: 'cv-dialog__backdrop',
        ariaLabelledBy: 'cv-modal-title',
        // Focus must leave the aria-hidden page at once; the viewport takes it next
        autoFocus: 'dialog',
      },
    );
  }
}
