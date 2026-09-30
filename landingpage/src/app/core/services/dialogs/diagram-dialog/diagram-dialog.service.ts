import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DiagramViewerData } from '../../../../shared/components/overlay/diagram-viewer/diagram-viewer.component';
import { DialogService } from '../dialog/dialog.service';
import { DialogUtils } from '../dialog/dialog.utils';

/** Opens a case-study diagram large, zoomable, in the CV's pop-up; fetched only when asked for */
@Service()
export class DiagramDialogService {
  private readonly dialog = inject(DialogService);

  /** Cold on purpose: nothing is fetched until a caller subscribes */
  public open(data: DiagramViewerData): Observable<void> {
    return DialogUtils.openLazy(
      this.dialog,
      () => import('../../../../shared/components/overlay/diagram-viewer/diagram-viewer.component'),
      (module) => module.DiagramViewerComponent,
      {
        data,
        // Wider than the CV's, since the drawings are landscape
        panelClass: ['cv-dialog', 'cv-dialog--wide'],
        backdropClass: 'cv-dialog__backdrop',
        ariaLabelledBy: 'diagram-modal-title',
        autoFocus: 'first-tabbable',
      },
    );
  }
}
