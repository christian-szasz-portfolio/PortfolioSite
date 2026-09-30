import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';

import { CookiesViewerComponent } from '../../../../shared/components/overlay/cookies-viewer/cookies-viewer.component';
import { CookiesDialogService } from './cookies-dialog.service';
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
interface CookiesDialogTestBed {
  readonly service: CookiesDialogService;
  readonly dialog: DialogStub;
}

function configure(): CookiesDialogTestBed {
  const dialog = new DialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: DialogService, useValue: dialog }],
  });

  return { service: TestBed.inject(CookiesDialogService), dialog };
}

describe('CookiesDialogService', () => {
  it('opens the cookies viewer, tied to its title for assistive technology', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open());

    expect(dialog.opened.length).toBe(1);
    expect(dialog.opened[0]?.component).toBe(CookiesViewerComponent);
    expect(dialog.opened[0]?.config['ariaLabelledBy']).toBe('cookies-modal-title');
  });
});
