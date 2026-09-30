import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { MediaViewerData } from '../../../../shared/components/overlay/media-viewer/media-viewer.component';
import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Opens a picture large in the CV's pop-up; the viewer is fetched only when asked for */
@Service()
export class MediaDialogService {
  private readonly dialog = inject(DialogService);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(data: MediaViewerData): Observable<void> {
    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/media-viewer/media-viewer.component'),
      (module) => module.MediaViewerComponent,
      {
        data,
        panelClass: 'cv-dialog',
        backdropClass: 'cv-dialog__backdrop',
        ariaLabelledBy: 'media-modal-title',
        autoFocus: 'first-tabbable',
      },
    );
  }
}
