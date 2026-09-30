import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Opens the sitemap in the CV's pop-up, fetched lazily so PROJECTS stays out of the bundle */
@Service()
export class SitemapDialogService {
  private readonly dialog = inject(DialogService);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(): Observable<void> {
    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/sitemap/sitemap.component'),
      (module) => module.SitemapComponent,
      {
        panelClass: 'cv-dialog',
        backdropClass: 'cv-dialog__backdrop',
        ariaLabelledBy: 'sitemap-modal-title',
        autoFocus: 'first-tabbable',
      },
    );
  }
}
