import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';

import type { ErrorReport } from '../../platform/error-handler/error-report';
import { DialogService } from '../dialog/dialog.service';
import { ErrorDialogService } from './error-dialog.service';

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

const REPORT: ErrorReport = { message: 'Error: broke', detailed: false };

/** The service under test and the dialog it was given */
interface ErrorDialogTestBed {
  readonly service: ErrorDialogService;
  readonly dialog: DialogStub;
}

function configure(): ErrorDialogTestBed {
  const dialog = new DialogStub();

  TestBed.configureTestingModule({
    providers: [{ provide: DialogService, useValue: dialog }],
  });

  return { service: TestBed.inject(ErrorDialogService), dialog };
}

describe('ErrorDialogService', () => {
  it('opens the error viewer with the report, tied to its title for assistive technology', async () => {
    const { service, dialog } = configure();

    await firstValueFrom(service.open(REPORT));

    expect(dialog.opened.length).toBe(1);
    expect(dialog.opened[0]?.config['ariaLabelledBy']).toBe('error-modal-title');
    expect(dialog.opened[0]?.config['data']).toBe(REPORT);
  });

  it('shows nothing for a second failure while the first is still up', async () => {
    const { service, dialog } = configure();
    await firstValueFrom(service.open(REPORT));

    await firstValueFrom(service.open(REPORT), { defaultValue: undefined });

    expect(dialog.opened.length).toBe(1);
  });

  it('shows the next failure once the pop-up has gone', async () => {
    const { service, dialog } = configure();
    await firstValueFrom(service.open(REPORT));

    service.closed();
    await firstValueFrom(service.open(REPORT));

    expect(dialog.opened.length).toBe(2);
  });
});
