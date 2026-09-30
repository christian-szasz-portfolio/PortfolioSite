import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';

import { CvViewerComponent } from '../../../../shared/components/overlay/cv-viewer/cv-viewer.component';
import { CvDialogService } from './cv-dialog.service';
import { DialogService } from '../dialog/dialog.service';

/** One recorded call to the dialog service */
interface OpenedDialog {
  readonly component: unknown;
  readonly config: Record<string, unknown>;
}

class DialogStub {
  public opened: OpenedDialog[] = [];

  public open(component: unknown, config: Record<string, unknown>): Observable<void> {
    this.opened.push({ component, config });
    return of(undefined);
  }
}

/** The service under test and the dialog it was given */
interface CvDialogTestBed {
  readonly service: CvDialogService;
  readonly dialog: DialogStub;
}

function configure(): CvDialogTestBed {
  const dialog = new DialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: DialogService, useValue: dialog }],
  });

  return { service: TestBed.inject(CvDialogService), dialog };
}

describe('CvDialogService', () => {
  it('opens the viewer with the panel and backdrop the design expects', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open());

    expect(dialog.opened.length).toBe(1);
    expect(dialog.opened[0]?.component).toBe(CvViewerComponent);
    expect(dialog.opened[0]?.config['panelClass']).toBe('cv-dialog');
    expect(dialog.opened[0]?.config['ariaLabelledBy']).toBe('cv-modal-title');
  });

  it('moves focus to the dialog, so nothing stays focused inside the hidden page', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open());

    // Not false: that leaves the trigger focused while the root is aria-hidden
    expect(dialog.opened[0]?.config['autoFocus']).toBe('dialog');
    expect(dialog.opened[0]?.config['restoreFocus']).toBe(true);
  });

  // Whether to open at all is DialogService's decision now, and is tested there.
});
