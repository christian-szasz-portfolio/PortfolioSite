import type { ComponentType } from '@angular/cdk/overlay';
import type { MatDialogConfig } from '@angular/material/dialog';
import { Observable, defer, from, switchMap } from 'rxjs';

import { DialogService } from './dialog.service';

/** What every pop-up here agrees on; the shell sizes itself, so the pane must not clip it */
const SHARED: MatDialogConfig = {
  restoreFocus: true,
  maxWidth: 'none',
  maxHeight: 'none',
};

/** The one way a pop-up is opened: its viewer fetched on subscription, never before */
export class DialogUtils {
  /**
   * Opens a viewer that is loaded only when a caller subscribes.
   *
   * @param dialog - the service that owns the pop-up
   * @param load - the dynamic import of the viewer's own chunk
   * @param pick - the component within that module
   * @param config - what this pop-up wants beyond the shared parts
   */
  public static openLazy<M, T>(
    dialog: DialogService,
    load: () => Promise<M>,
    pick: (module: M) => ComponentType<T>,
    config: MatDialogConfig = {},
  ): Observable<void> {
    // Deferred, so nothing is fetched until the caller subscribes; the dialog itself is lazy too
    return defer(() => from(load())).pipe(
      switchMap((module) => dialog.open(pick(module), { ...SHARED, ...config })),
    );
  }
}
