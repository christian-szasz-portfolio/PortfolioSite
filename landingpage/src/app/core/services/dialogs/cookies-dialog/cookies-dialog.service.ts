import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Opens the cookies-and-storage text in a pop-up; MatDialog supplies the chrome. */
@Service()
export class CookiesDialogService {
  private readonly dialog = inject(DialogService);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(): Observable<void> {
    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/cookies-viewer/cookies-viewer.component'),
      (module) => module.CookiesViewerComponent,
      {
        panelClass: 'cv-dialog',
        ariaLabelledBy: 'cookies-modal-title',
      },
    );
  }
}
