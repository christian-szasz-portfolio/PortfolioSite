import { ComponentType } from '@angular/cdk/overlay';
import { MatDialogConfig } from '@angular/material/dialog';
import { Observable, firstValueFrom, of } from 'rxjs';

import { DialogService } from './dialog.service';
import { DialogUtils } from './dialog.utils';

class Viewer {}

/** One recorded call to the dialog service */
interface OpenedDialog {
  readonly component: unknown;
  readonly config: MatDialogConfig;
}

class DialogStub {
  public opened: OpenedDialog[] = [];

  public open(component: unknown, config: MatDialogConfig): Observable<void> {
    this.opened.push({ component, config });
    return of(undefined);
  }
}

describe('DialogUtils', () => {
  const setUp = () => {
    const dialog = new DialogStub();
    let loads = 0;
    const load = () => {
      loads += 1;
      return Promise.resolve({ Viewer: Viewer as ComponentType<Viewer> });
    };
    return { dialog, load, loads: () => loads };
  };

  it('fetches nothing until a caller subscribes', async () => {
    const { dialog, load, loads } = setUp();

    const opening = DialogUtils.openLazy(dialog as unknown as DialogService, load, (m) => m.Viewer);

    expect(loads()).toBe(0);
    expect(dialog.opened.length).toBe(0);

    await firstValueFrom(opening);

    expect(loads()).toBe(1);
    expect(dialog.opened[0]?.component).toBe(Viewer);
  });

  it('gives every pop-up the parts they share, and lets each add its own', async () => {
    const { dialog, load } = setUp();

    await firstValueFrom(
      DialogUtils.openLazy(dialog as unknown as DialogService, load, (m) => m.Viewer, {
        panelClass: 'cv-dialog',
        ariaLabelledBy: 'cv-modal-title',
      }),
    );

    expect(dialog.opened[0]?.config).toEqual({
      restoreFocus: true,
      maxWidth: 'none',
      maxHeight: 'none',
      panelClass: 'cv-dialog',
      ariaLabelledBy: 'cv-modal-title',
    });
  });

  it('lets a pop-up overrule a shared part', async () => {
    const { dialog, load } = setUp();

    await firstValueFrom(
      DialogUtils.openLazy(dialog as unknown as DialogService, load, (m) => m.Viewer, {
        restoreFocus: false,
      }),
    );

    expect(dialog.opened[0]?.config.restoreFocus).toBe(false);
  });
});
