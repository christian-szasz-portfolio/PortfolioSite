import { Service, inject, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';

import type { ErrorReport } from '../../platform/error-handler/error-report';
import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Shows a failure in a pop-up, one at a time. */
@Service()
export class ErrorDialogService {
  private readonly dialog = inject(DialogService);

  private readonly showing = signal(false);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(report: ErrorReport): Observable<void> {
    // One failure usually brings others, and a stack of pop-ups reports none of them well.
    if (this.showing()) {
      return EMPTY;
    }

    this.showing.set(true);

    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/error-viewer/error-viewer.component'),
      (module) => module.ErrorViewerComponent,
      {
        panelClass: 'error-dialog',
        ariaLabelledBy: 'error-modal-title',
        data: report,
      },
    );
  }

  /** Called by the pop-up as it goes, so the next failure can be shown. */
  public closed(): void {
    this.showing.set(false);
  }
}
